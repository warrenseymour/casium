import { always, cond, mergeDeepWithKey, path, pipe, prop, T } from 'ramda';
import { Container } from './core';
import { devToolsPlugin } from './dev_tools';
import { default as coreDispatcher, handler } from './dispatcher';
import effects from './effects';
import { Plugin } from './environment/plugin';
import Message, { MessageConstructor } from './message';
import ExecContext, { ExecContextPartial } from './runtime/exec_context';
import StateManager from './runtime/state_manager';
import { ProcessState } from './subscription';
import { mergeMap } from './util';

export type Dispatcher = (...args: any[]) => any | void;
export type CommandDispatcher = (data: object, dispatch: Dispatcher) => any | void;
export type SubscriptionDispatcher = (processState: ProcessState, dispatch: Dispatcher) => any | void;

export type EnvDefPartial = {
  dispatcher: any;
  log?: (...args: any[]) => any | void;
  stateManager?: (container?: Container<any>) => StateManager;
  plugins?: Plugin[]
};

export type EnvDef = EnvDefPartial & {
  effects: Map<MessageConstructor, CommandDispatcher | SubscriptionDispatcher>;
};

export type Environment = EnvDefPartial & {
  handler: (msg: Message) => MessageConstructor;
  identity: () => EnvDef;
};

/**
 * Creates an execution environment for a container by providing it with a set of effects
 * handlers and an effect dispatcher.
 *
 * @param  {Map} effects A map pairing message classes to handler functions for that
 *               message type.
 * @param  {Function} dispatcher A message dispatcher function that accepts an effect
 *               map, a container message dispatcher (i.e. the update loop), and a message to
 *               dispatch. Should be a curried function.
 * @param  {Function} stateManager A function that returns a new instance of `StateManager`.
 * @param {Array} plugins A list of Plugins that should be registered with the
 * execution environment
 * @return {Object} Returns an environment object with the following functions:
 *         - dispatcher: A curried function that accepts a container-bound message dispatcher
 *           and a command message
 *         - stateManager: A StateManager factory function
 *         - identity: Returns the parameters that created this environment
 */
export const create = ({
  effects,
  dispatcher = null,
  log = null,
  stateManager = null,
  plugins = []
}: EnvDef): Environment => ({
  dispatcher: (dispatcher || coreDispatcher)(effects),
  handler: handler(effects),
  identity: () => ({ effects, dispatcher, log, stateManager }),
  log: log || console.error.bind(console),
  stateManager: stateManager || (() => new StateManager()),
  plugins
});

/**
 * Defines the default 'root' Environment, using the builtin Effects handlers,
 * Dispatcher, and Dev Tools plugin.
 */
export const root: Environment = create({
  effects,
  dispatcher: coreDispatcher,
  plugins: [devToolsPlugin]
});

/**
 * Helper function for `create()`, to merge effects maps
 */
const mergeWithEffects = mergeDeepWithKey((key, left, right) => key === 'effects' ? mergeMap(left, right) : right);

/**
 * Helper function for `create()`. Validates state of environments.
 */
const checkEnvChain = <M>(parent?: ExecContext<M> | ExecContextPartial, env?: Environment): any => ({
  env,
  parent,
  canMerge: env && parent instanceof ExecContext && parent.env,
  hasOnlyParent: !env && parent instanceof ExecContext && parent.env,
  isOnlyChild: env && (!parent || !(parent instanceof ExecContext) || !parent.env),
});

export const merge: <M>(parent?: ExecContext<M> | ExecContextPartial, env?: Environment) => Environment = pipe(
  checkEnvChain,
  cond([
    [prop('canMerge'), ({ parent, env }) => create(mergeWithEffects(parent.env.identity(), env.identity()))],
    [prop('hasOnlyParent'), path(['parent', 'env'])],
    [prop('isOnlyChild'), prop('env')],
    [T, always(root)]
  ])
);
