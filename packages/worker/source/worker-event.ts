export type WorkerMessage = (
	| {
			type: 'result';
			data: {
				result: boolean;
				testName: string;
			};
	  }
	| {
			type: 'planned';
			data: {
				withSkipModifier: number;
				withOnlyModifier: number;
				withoutModifiers: number;
				total: number;
			};
	  }
	| {
			type: 'done';
			data: Record<string, never>;
	  }
) & {
	suiteName: string;
};
