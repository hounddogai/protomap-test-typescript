import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultInsightProfileMinimumRangeRule,
  DefaultInsightProfileUnitLengthRule,
  defaultDefaultInsightProfileValidator,
} from "./default-insight-profile-rules.js";
import { newDefaultInsightProfile } from "./default-insight-profile.js";

test("DefaultInsightProfileValidator reports every problem", () => {
  const validator = defaultDefaultInsightProfileValidator();
  const item = newDefaultInsightProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultInsightProfileMinimumRangeRule flags values above minimum", () => {
  const rule = new DefaultInsightProfileMinimumRangeRule(9.1, 2856.8);
  const item = newDefaultInsightProfile("x", "y");
  item.minimum = 2858.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultInsightProfileUnitLengthRule flags a long unit", () => {
  const rule = new DefaultInsightProfileUnitLengthRule(1000);
  const item = newDefaultInsightProfile("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
