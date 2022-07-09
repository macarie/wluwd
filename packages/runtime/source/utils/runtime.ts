export type RuntimeFunction = () =>
	| AsyncGenerator<boolean, void>
	| Generator<boolean, void>;

export const runtime = async (fn: RuntimeFunction) => {
	for await (const step of fn()) {
		if (!step) {
			return false;
		}
	}

	return true;
};
