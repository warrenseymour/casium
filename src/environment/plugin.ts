import { Container, GenericObject } from '../core';
import ExecContext from '../runtime/exec_context';
import StateManager from '../runtime/state_manager';

export type NotifyMessage = {
  context: ExecContext<any>;
  container: Container<any>;
  msg: GenericObject | null;
  next: GenericObject;
  path: (string | symbol)[];
  prev: GenericObject;
  subs: any[];
  cmds: any[];
};

export type NotifyFn = (msg: NotifyMessage) => void;
export type InterceptFn = (stateManager: StateManager) => StateManager;

/**
 * Plugins allow custom behaviour to be attached to an environment. Internally,
 * Casium uses this mechanism to expose the root StateManager instance and
 * message dispatch notifications to a DevTools client, if found.
 */
export type Plugin = {
  // Called whenever a Message is dispatched
  notify: NotifyFn
  // Called when the root StateManager instance is created
  intercept: InterceptFn
};
