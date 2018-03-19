import { InterceptFn, NotifyFn, Plugin } from './environment/plugin';

/**
 * A Dev Tools client should conform to this interface by at least providing the
 * `notify` and `intercept` functions.
 */
export interface Client {
  notify: NotifyFn;
  intercept: InterceptFn;
}

export const clientKey = '__CASIUM_DEVTOOLS_GLOBAL_CLIENT__';

/**
 * We explicitly avoid declaring a `Window` interface within the `global` var to
 * avoid polluting type definitions of consuming libraries
 */
declare var window: WindowWithClient | undefined;

interface WindowWithClient extends Window {
  __CASIUM_DEVTOOLS_GLOBAL_CLIENT__?: Client;
}

/**
 * The built-in Dev Tools plugin is added to the default 'root' Environment. It
 * simply calls through to the `notify` and `intercept` functions on an instance
 * of a Dev Tools client that has been attached at `window[clientKey]`.
 *
 * These functions are a no-op if no such client exists (ie, the user does not
 * have any Dev Tools client running.)
 */
export const devToolsPlugin: Plugin = {
  notify: msg => {
    typeof window !== 'undefined' &&
      typeof window[clientKey] !== 'undefined' &&
      window[clientKey].notify(msg);
  },

  intercept: stateManager =>
    typeof window !== 'undefined' &&
    typeof window[clientKey] !== 'undefined' &&
    window[clientKey].intercept(stateManager) ||
    stateManager
};
