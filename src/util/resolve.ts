import isNode from './server/is-node';

export const resolveFetch = async () => {
  const node = isNode();
  if (!node) return window.fetch;

  if (node !== 'node') {
    (globalThis as any).fallbackFetch = true;
    (globalThis.fetch as any) = (await import('node-fetch')).default;
  }
  return globalThis.fetch;
};
