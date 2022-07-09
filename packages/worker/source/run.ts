import { Worker } from 'node:worker_threads';

/**
 * Run a file in a `Worker`.
 */
export const run = (path: string) => new Worker(path);
