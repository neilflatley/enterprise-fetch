import isClient from './client/is-client';

export const resolveFetch = async () => {
  const node = isNode();
  if (!node) return window.fetch;
  if (node === 'node') return globalThis.fetch;

  const nodeFetch = await import('node-fetch');
  return nodeFetch.default as unknown as typeof globalThis.fetch;
};

export const isNode = () => {
  if (isClient()) return false;
  if (typeof globalThis.fetch === 'function') return 'node';
  return 'node-fetch';
};
