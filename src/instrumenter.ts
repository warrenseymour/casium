import { Container, GenericObject } from './core';
import ExecContext from './runtime/exec_context';

import { applyTo } from 'ramda';

export const instrumenterKey = '__CASIUM_INSTRUMENTERS__';

declare global {
  interface Window {
    // @todo: We can use `[instrumenterKey]?:` once TypeScript 2.8 lands
    __CASIUM_INSTRUMENTERS__?: Instrumenter[];
  }
}

/**
 * An 'instrumenter' is simply a function that is called whenever a Message is
 * dispatched.
 *
 * An array of Instrumenters is exposed as `window[instrumenterKey]`, and custom
 * instrumenters can be added by appending them to this array.
 */
export type Instrumenter = (data: InstrumentationData) => void;

export type InstrumentationData = {
  context: ExecContext<any>;
  container: Container<any>;
  msg: GenericObject | null;
  next: GenericObject;
  path: (string | symbol)[];
  prev: GenericObject;
  subs: any[];
  cmds: any[];
};

/**
 * Initialize `window[instrumenterKey]` only if `window` exists (ie, we are
 * running in a browser) and has not already been defined.
 */
export const init = () =>
  typeof window !== 'undefined' &&
  typeof window[instrumenterKey] === 'undefined' &&
  (window[instrumenterKey] = []);

export const notify = (data: InstrumentationData) =>
  typeof window !== 'undefined' &&
  typeof window[instrumenterKey] !== 'undefined' &&
  (window[instrumenterKey].forEach(applyTo(data)));
