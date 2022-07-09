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
		send({ result: true, suiteName, testName });
	}
};

const runTestsAndSendResults = async (suiteName: string, tests: TestStore[]) =>
	Promise.all(
		tests.map(async ([fn, testName]) => {
			const result = await runtime(fn);

			send({ result, suiteName, testName });
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
		if (testsWithSkipModifier.length > 0) {
			sendSkippedTests(suiteName, testsWithSkipModifier);
		}

		if (testsWithOnlyModifier.length > 0) {
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
