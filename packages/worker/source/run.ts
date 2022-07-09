import { Worker } from 'node:worker_threads';

export const run = (path: string) => new Worker(path);
