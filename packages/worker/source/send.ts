import { parentPort } from 'node:worker_threads';

import type { WorkerMessage } from './worker-event.js';

/**
 * Send a message to the parent thread.
 */
export const send = (message: WorkerMessage) =>
	parentPort?.postMessage(message);
