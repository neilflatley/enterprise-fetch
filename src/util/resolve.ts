import isClient from './client/is-client';

export const resolveFetch = async () => {
  if (isClient()) return window.fetch;

  if (typeof globalThis.fetch === 'function') return globalThis.fetch;

  const nodeFetch = await import('node-fetch');
  // recast node-fetch to keep typescript happy
  return (nodeFetch.default as unknown) as typeof globalThis.fetch;
};
