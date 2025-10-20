export const tryParse = (str: string) => {
  try {
    return typeof str === 'object' ? str : JSON.parse(str);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
};

export const isJson = (str: string) =>
  typeof str === 'object' || !!tryParse(str);

export const tryStringify = (obj: any) => {
  try {
    return typeof obj === 'object' ? JSON.stringify(obj) : obj;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return obj;
  }
};
