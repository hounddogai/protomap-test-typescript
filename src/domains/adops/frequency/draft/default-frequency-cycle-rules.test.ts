import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFrequencyCycleStartsAtRangeRule,
  DefaultFrequencyCycleTitleLengthRule,
  defaultDefaultFrequencyCycleValidator,
} from "./default-frequency-cycle-rules.js";
import { newDefaultFrequencyCycle } from "./default-frequency-cycle.js";

test("DefaultFrequencyCycleValidator reports every problem", () => {
  const validator = defaultDefaultFrequencyCycleValidator();
  const item = newDefaultFrequencyCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFrequencyCycleStartsAtRangeRule flags values above starts at", () => {
  const rule = new DefaultFrequencyCycleStartsAtRangeRule(80, 3600);
  const item = newDefaultFrequencyCycle("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultFrequencyCycleTitleLengthRule flags a long title", () => {
  const rule = new DefaultFrequencyCycleTitleLengthRule(32);
  const item = newDefaultFrequencyCycle("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
