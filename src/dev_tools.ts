import { Container, GenericObject } from './core';
import ExecContext from './runtime/exec_context';
import StateManager from './runtime/state_manager';

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

export type Client = {
  notify(msg: NotifyMessage);
  intercept(stateManager: StateManager): StateManager;
};

export const intercept = (stateManager: StateManager) => {
  return typeof (window as any).__CASIUM_DEVTOOLS_GLOBAL_CLIENT__ !== 'undefined' &&
    (window as any).__CASIUM_DEVTOOLS_GLOBAL_CLIENT__.intercept(stateManager) || stateManager;
};

export const notify = (msg: NotifyMessage) => {
  typeof (window as any).__CASIUM_DEVTOOLS_GLOBAL_CLIENT__ !== 'undefined' &&
    (window as any).__CASIUM_DEVTOOLS_GLOBAL_CLIENT__.notify(msg);
};
