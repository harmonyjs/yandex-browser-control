/**
 * Minimal async middleware utilities (Koa-style) for deferred runners.
 *
 * Contracts:
 * - Runner<T>  = () => Promise<T>
 * - Wrapper<T> = (next: Runner<T>) => Runner<T>
 * - chain<T>(...wrappers) returns a function that applies wrappers right-to-left to a leaf runner.
 */
export type Runner<T> = () => Promise<T>;

export type Wrapper<T> = (next: Runner<T>) => Runner<T>;

/**
 * Compose wrappers from right to left and apply them to a leaf runner.
 */
export function chain<T>(
  ...wrappers: Wrapper<T>[]
): (leaf: Runner<T>) => Runner<T> {
  return (leaf: Runner<T>): Runner<T> =>
    wrappers.reduceRight((acc, w) => w(acc), leaf);
}
