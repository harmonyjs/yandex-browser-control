/** Generic validators (type-agnostic) */

const MAX_PORT = 65535;
export const isPort = (v: number): boolean => Number.isInteger(v) && v > 0 && v <= MAX_PORT;

export const isPositiveInt = (v: number): boolean => Number.isInteger(v) && v > 0;

export const isUrl = (v: string): boolean => {
  try {
    // for validator of string (before map to URL)
    new URL(v);
    return true;
  } catch {
    return false;
  }
};
