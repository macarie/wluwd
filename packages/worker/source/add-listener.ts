import type { WorkerMessage } from './worker-event.js';
import type { Worker } from 'node:worker_threads';

// https://github.com/microsoft/TypeScript/issues/32164#issuecomment-1146737709
type RecurseOnOverload<
	WholeOverload,
	PartialOverload = unknown,
> = WholeOverload extends (...args: infer Args) => infer Return
	? PartialOverload extends WholeOverload
		? never
		:
				| ((...args: Args) => Return)
				| RecurseOnOverload<
						PartialOverload & WholeOverload,
						PartialOverload & ((...args: Args) => Return)
				  >
	: never;
type OverloadToUnion<Overload extends (...args: any[]) => any> = Exclude<
	RecurseOnOverload<(() => never) & Overload>,
	Overload extends () => never ? never : () => never
>;

type GetWorkerOnHandler<Event extends string> = Extract<
	Parameters<
		Extract<
			OverloadToUnion<Worker['on']>,
			(event: Event, listener: any) => Worker
		>
	>,
	[Event, any]
>[1];

export const addListener = <Event extends 'message' | 'error' | 'exit'>(
	worker: Worker,
	event: Event,
	handler: Event extends 'message'
		? (result: WorkerMessage) => void
		: GetWorkerOnHandler<Event>,
) => {
	worker.on(event, handler);
};
