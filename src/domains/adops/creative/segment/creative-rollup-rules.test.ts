import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeRollupDurationMinutesRangeRule,
  CreativeRollupLabelLengthRule,
  defaultCreativeRollupValidator,
} from "./creative-rollup-rules.js";
import { newCreativeRollup } from "./creative-rollup.js";

test("CreativeRollupValidator reports every problem", () => {
  const validator = defaultCreativeRollupValidator();
  const item = newCreativeRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeRollupDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CreativeRollupDurationMinutesRangeRule(16, 120);
  const item = newCreativeRollup("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeRollupLabelLengthRule flags a long label", () => {
  const rule = new CreativeRollupLabelLengthRule(255);
  const item = newCreativeRollup("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
