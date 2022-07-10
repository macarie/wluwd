import { runtime } from './utils/runtime.js';
import { send } from '@wluwd/worker';

import type { RuntimeFunction } from './utils/runtime.js';

type TestStore = [fn: RuntimeFunction, testName: string];

type TestFunction = (testName: string, fn: RuntimeFunction) => void;
type Test = TestFunction & {
	only: TestFunction;
	skip: TestFunction;
};

const sendSkippedTests = (suiteName: string, tests: TestStore[]) => {
	for (const [, testName] of tests) {
		send({
			type: 'result',
			suiteName,
			data: {
				result: true,
				testName,
			},
		});
	}
};

const runTestsAndSendResults = async (suiteName: string, tests: TestStore[]) =>
	Promise.all(
		tests.map(async ([fn, testName]) => {
			const result = await runtime(fn);

			send({
				type: 'result',
				suiteName,
				data: {
					result,
					testName,
				},
			});
		}),
	);

/**
 * Create a new {@link Test `Test`} instance.
 *
 * @param suiteName The name of your suite.
 */
export const suite = (suiteName: string) => {
	const testsWithoutModifiers: TestStore[] = [];
	const testsWithOnlyModifier: TestStore[] = [];
	const testsWithSkipModifier: TestStore[] = [];

	const run = async () => {
		const numberOfTestsWithSkipModifier = testsWithSkipModifier.length;
		const numberOfTestsWithOnlyModifier = testsWithOnlyModifier.length;
		const numberOfTestsWithoutModifiers = testsWithoutModifiers.length;

		send({
			type: 'planned',
			suiteName,
			data: {
				withSkipModifier: numberOfTestsWithSkipModifier,
				withOnlyModifier: numberOfTestsWithOnlyModifier,
				withoutModifiers: numberOfTestsWithoutModifiers,
				total:
					numberOfTestsWithSkipModifier +
					numberOfTestsWithOnlyModifier +
					numberOfTestsWithoutModifiers,
			},
		});

		if (numberOfTestsWithSkipModifier > 0) {
			sendSkippedTests(suiteName, testsWithSkipModifier);
		}

		if (numberOfTestsWithOnlyModifier > 0) {
			sendSkippedTests(suiteName, testsWithoutModifiers);

			return runTestsAndSendResults(suiteName, testsWithOnlyModifier);
		}

		return runTestsAndSendResults(suiteName, testsWithoutModifiers);
	};

	let isMicrotaskSet = false;

	// Macros would've been helpful here, but it is what it is...
	const test: Test = (testName, fn) => {
		testsWithoutModifiers.push([fn, testName]);

		if (isMicrotaskSet) {
			return;
		}

		queueMicrotask(run);
		isMicrotaskSet = true;
	};

	test.only = (testName, fn) => {
		testsWithOnlyModifier.push([fn, testName]);

		if (isMicrotaskSet) {
			return;
		}

		queueMicrotask(run);
		isMicrotaskSet = true;
	};

	test.skip = (testName, fn) => {
		testsWithSkipModifier.push([fn, testName]);

		if (isMicrotaskSet) {
			return;
		}

		queueMicrotask(run);
		isMicrotaskSet = true;
	};

	return test;
};
