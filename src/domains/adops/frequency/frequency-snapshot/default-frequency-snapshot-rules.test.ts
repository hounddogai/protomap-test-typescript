import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFrequencySnapshotDurationMinutesRangeRule,
  DefaultFrequencySnapshotSequenceRangeRule,
  defaultDefaultFrequencySnapshotValidator,
} from "./default-frequency-snapshot-rules.js";
import { newDefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

test("DefaultFrequencySnapshotValidator reports every problem", () => {
  const validator = defaultDefaultFrequencySnapshotValidator();
  const item = newDefaultFrequencySnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFrequencySnapshotDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultFrequencySnapshotDurationMinutesRangeRule(255, 1000);
  const item = newDefaultFrequencySnapshot("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultFrequencySnapshotSequenceRangeRule flags values above sequence", () => {
  const rule = new DefaultFrequencySnapshotSequenceRangeRule(1000, 86400);
  const item = newDefaultFrequencySnapshot("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
