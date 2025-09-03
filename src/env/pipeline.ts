/**
 * Pipeline core: env(), typed transforms, reporting shape
 * No app-specific logic here.
 */
export type EnvState<T> = {
  readonly name: string;
  readonly raw: string | undefined; // original process.env value
  readonly value: T | undefined; // current value in pipeline
  readonly defaultValue: T | undefined;
  readonly error?: string;
  readonly usedDefault: boolean; // default actually applied
};

export type EnvReport = {
  name: string;
  value: string; // stringified for logging/telemetry
  raw?: string;
  wasUnset: boolean;
  defaultUsed: boolean;
  error?: string;
};

export type Pipeline<T> = {
  /** Set default; if current value is undefined — apply immediately. */
  default: (value: T) => Pipeline<T>;

  /** Transform current T; returning undefined triggers fallback to default. */
  transform: (fn: (v: T) => T | undefined) => Pipeline<T>;

  /** Change type T -> U. Returning undefined triggers fallback to mapped default. */
  map: <U>(fn: (v: T) => U | undefined) => Pipeline<U>;

  /** Validate current T; on failure fallback to default and record error. */
  validate: {
    <U extends T>(fn: (v: T) => v is U, errorMsg?: (v: T) => string): Pipeline<U>;
    (fn: (v: T) => boolean, errorMsg?: (v: T) => string): Pipeline<T>;
  };

  /** Side-effect for reporting/logging. */
  tap: (fn: (state: EnvState<T>) => void) => Pipeline<T>;

  /**
   * Get final value T (or default if set). If both are undefined, returns "" casted.
   * ⚠️ For non-string pipelines, always set a default after map().
   */
  value: () => T;
};

// ------------------------- internals -------------------------

const setDefault = <T>(state: EnvState<T>, defaultValue: T): EnvState<T> => {
  const willUseDefaultNow = state.value === undefined;
  return {
    ...state,
    defaultValue,
    value: willUseDefaultNow ? defaultValue : state.value,
    usedDefault: state.usedDefault || willUseDefaultNow,
  };
};

const applyTransform = <T>(
  state: EnvState<T>,
  fn: (v: T) => T | undefined
): EnvState<T> => {
  if (state.value === undefined) return state;

  const t = fn(state.value);
  if (t === undefined) {
    return {
      ...state,
      value: state.defaultValue,
      usedDefault: state.usedDefault || state.defaultValue !== undefined || true,
    };
  }
  return { ...state, value: t };
};

const applyMap = <T, U>(
  state: EnvState<T>,
  fn: (v: T) => U | undefined
): EnvState<U> => {
  const mappedDefault = state.defaultValue !== undefined ? fn(state.defaultValue) : undefined;
  const mappedValueDirect = state.value !== undefined ? fn(state.value) : undefined;

  const shouldFallback =
    state.value !== undefined && mappedValueDirect === undefined && mappedDefault !== undefined;

  return {
    name: state.name,
    raw: state.raw,
    value: shouldFallback ? mappedDefault : mappedValueDirect,
    defaultValue: mappedDefault,
    error: state.error,
    usedDefault: state.usedDefault || shouldFallback,
  };
};

const applyValidate = <T>(
  state: EnvState<T>,
  fn: (v: T) => boolean,
  errorMsg: (v: T) => string = (v) => `Invalid value: ${String(v)}`
): EnvState<T> => {
  if (state.value === undefined || state.usedDefault) return state;

  if (!fn(state.value)) {
    return {
      ...state,
      value: state.defaultValue,
      usedDefault: true,
      error: errorMsg(state.value),
    };
  }
  return state;
};

// ------------------------- public helpers -------------------------

export const createReport = <T>(state: EnvState<T>): EnvReport => ({
  name: state.name,
  value: state.value === undefined ? "" : String(state.value),
  raw: state.raw,
  wasUnset: state.raw === undefined,
  defaultUsed: state.usedDefault,
  error: state.error,
});

// ------------------------- factory -------------------------

const createPipelineState = <T>(state: EnvState<T>): Pipeline<T> => {
  const validateImpl = (
    fn: (v: T) => boolean,
    errorMsg?: (v: T) => string,
  ): Pipeline<T> => createPipelineState(applyValidate(state, fn, errorMsg));

  const obj = {
    default(value: T) {
      return createPipelineState(setDefault(state, value));
    },
    transform(fn: (v: T) => T | undefined) {
      return createPipelineState(applyTransform(state, fn));
    },
    map<U>(fn: (v: T) => U | undefined) {
      const next = applyMap(state, fn);
      return createPipelineStateU(next);
    },
    validate: validateImpl as unknown as Pipeline<T>["validate"],
    tap(fn: (s: EnvState<T>) => void) {
      fn(state);
      return createPipelineState(state);
    },
    value(): T {
      if (state.value !== undefined) return state.value;
      if (state.defaultValue !== undefined) return state.defaultValue;
      return "" as unknown as T;
    },
  } as const;
  return obj as unknown as Pipeline<T>;
};

const createPipelineStateU = <U>(stateU: EnvState<U>): Pipeline<U> => {
  const validateImpl = (
    fn: (v: U) => boolean,
    errorMsg?: (v: U) => string,
  ): Pipeline<U> => createPipelineStateU(applyValidate(stateU, fn, errorMsg));

  const obj = {
    default(value: U) {
      return createPipelineStateU(setDefault(stateU, value));
    },
    transform(fn: (v: U) => U | undefined) {
      return createPipelineStateU(applyTransform(stateU, fn));
    },
    map<V>(fn: (v: U) => V | undefined) {
      return createPipelineStateV(applyMap(stateU, fn));
    },
    validate: validateImpl as unknown as Pipeline<U>["validate"],
    tap(fn: (s: EnvState<U>) => void) {
      fn(stateU);
      return createPipelineStateU(stateU);
    },
    value(): U {
      if (stateU.value !== undefined) return stateU.value;
      if (stateU.defaultValue !== undefined) return stateU.defaultValue;
      return "" as unknown as U;
    },
  } as const;
  return obj as unknown as Pipeline<U>;
};

const createPipelineStateV = createPipelineStateU;

export function env<T extends string = string>(name: string, raw: string | undefined): Pipeline<T> {
  const initialState: EnvState<T> = {
    name,
    raw,
    value: raw as unknown as T,
    defaultValue: undefined,
    usedDefault: false,
  };

  return createPipelineState(initialState);
}
