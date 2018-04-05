import * as PropTypes from 'prop-types';
import { equals, keys, merge, mergeAll, omit, pick } from 'ramda';
import * as React from 'react';
import ErrorComponent from './components/error';
import { Container, DelegateDef, Emitter } from './core';
import { Environment } from './environment';
import { Activate, Deactivate, MessageConstructor, Refresh } from './message';
import ExecContext from './runtime/exec_context';

export type ViewWrapperProps<M> = {
  childProps: M & { emit: Emitter };
  container: Container<M>;
  delegate: DelegateDef;
  env?: Environment;
};

export type State = {
  componentError?: Error;
};

export type Context<M> = {
  execContext: ExecContext<M>;
};

/**
 * Component used to wrap container-defined view, for managing state and injecting
 * container-bound props.
 *
 * This component looks for `execContext` in its parent context, and propagates
 * itself with `execContext` in its children's contexts.
 */

export default class ViewWrapper<M> extends React.Component<ViewWrapperProps<M>, State> {
  public static contextTypes = { execContext: PropTypes.object };

  public static childContextTypes = { execContext: PropTypes.object };

  public static propTypes = {
    childProps: PropTypes.object.isRequired,
    container: PropTypes.object.isRequired,
    delegate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.symbol,
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string]))
    ]),
    env: PropTypes.object.isRequired,
  };

  public static defaultProps = { delegate: null };

  public execContext?: ExecContext<M> = null;

  public unsubscribe: () => void;

  public state: State = {};

  public context: Context<M>;

  constructor(props: ViewWrapperProps<M>, context: Context<M>) {
    super(props, context);

    const { container, delegate, env, childProps } = props;
    const parent = context.execContext;

    this.execContext = new ExecContext({ env, parent, container, delegate });

    if (this.dispatchLifecycleMessage(Activate, props)) {
      return;
    }

    const state = this.execContext.state();
    this.state = this.execContext.push(merge(state, pick(keys(state), childProps)));
  }

  public componentDidMount() {
    const { delegate } = this.props;
    const parent = this.context.execContext;

    if (delegate && !parent) {
      const msg = `Attempting to delegate state property '${delegate.toString()}' with no parent container`;
      console.warn(msg); // tslint:disable-line:no-console
    }

    this.unsubscribe = this.execContext.subscribe(this.setState.bind(this));
  }

  public getChildContext() {
    return { execContext: this.execContext };
  }

  public dispatchLifecycleMessage<M extends MessageConstructor>(msg: M, props: any): boolean {
    const { container, childProps } = props, propList = omit(['emit', 'children']);
    return container.accepts(msg) && !!this.execContext.dispatch(new msg(propList(childProps), { shallow: true }));
  }

  public componentDidUpdate(prev) {
    const { childProps } = this.props;
    const omitChildren = omit(['children']);
    if (!equals(omitChildren(prev.childProps), omitChildren(childProps))) {
      this.dispatchLifecycleMessage(Refresh, this.props);
    }
  }

  public componentWillUnmount() {
    this.dispatchLifecycleMessage(Deactivate, this.props);
    this.unsubscribe();
    this.execContext.destroy();
  }

  public componentDidCatch(e) {
    // tslint:disable-next-line:no-console
    console.error('Failed to compile React component\n', e);
    this.setState({ componentError: e });
  }

  public render() {
    if (this.state.componentError) {
      return <ErrorComponent message={this.state.componentError.toString()} />;
    }
    // tslint:disable-next-line:variable-name
    const Child = (this.props.container as any).view, ctx = this.execContext;
    const props = mergeAll([this.props.childProps, ctx.state(), { emit: ctx.emit.bind(ctx), relay: ctx.relay() }]);
    return <Child {...props} />;
  }
}
