export const isSysError = (error: any): error is Error =>
  error && error.message !== undefined;

export const isFunc = (func: any) => typeof func === 'function';
