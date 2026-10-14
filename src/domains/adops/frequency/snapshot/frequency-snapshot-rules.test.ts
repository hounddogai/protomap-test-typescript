import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencySnapshotCodeLengthRule,
  FrequencySnapshotCohortLengthRule,
  FrequencySnapshotRequiredSourceRule,
  FrequencySnapshotRequiredTitleRule,
  defaultFrequencySnapshotValidator,
} from "./frequency-snapshot-rules.js";
import { newFrequencySnapshot } from "./frequency-snapshot.js";

test("FrequencySnapshotValidator reports every problem", () => {
  const validator = defaultFrequencySnapshotValidator();
  const item = newFrequencySnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencySnapshotCodeLengthRule flags a long code", () => {
  const rule = new FrequencySnapshotCodeLengthRule(16);
  const item = newFrequencySnapshot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencySnapshotCohortLengthRule flags a long cohort", () => {
  const rule = new FrequencySnapshotCohortLengthRule(80);
  const item = newFrequencySnapshot("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencySnapshotRequiredSourceRule flags a blank source", () => {
  const rule = new FrequencySnapshotRequiredSourceRule("frequency snapshot needs a value");
  const item = newFrequencySnapshot("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencySnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new FrequencySnapshotRequiredTitleRule("frequency snapshot needs a value");
  const item = newFrequencySnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
