import isClient from '../client/is-client';

const isNode = () => {
  if (isClient()) return false;
  if (
    !(globalThis as any).fallbackFetch &&
    typeof globalThis.fetch === 'function'
  )
    return 'node';
  return 'node-fetch';
};

export default isNode;
