import { parentPort } from 'node:worker_threads';

import type { WorkerMessage } from './worker-event.js';

export const send = (message: WorkerMessage) =>
	parentPort?.postMessage(message);
