import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEnrollmentOverrideCodeLengthRule,
  SeasonalEnrollmentOverrideMinimumRangeRule,
  defaultSeasonalEnrollmentOverrideValidator,
} from "./seasonal-enrollment-override-rules.js";
import { newSeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

test("SeasonalEnrollmentOverrideValidator reports every problem", () => {
  const validator = defaultSeasonalEnrollmentOverrideValidator();
  const item = newSeasonalEnrollmentOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEnrollmentOverrideCodeLengthRule flags a long code", () => {
  const rule = new SeasonalEnrollmentOverrideCodeLengthRule(3600);
  const item = newSeasonalEnrollmentOverride("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalEnrollmentOverrideMinimumRangeRule flags values above minimum", () => {
  const rule = new SeasonalEnrollmentOverrideMinimumRangeRule(3.9, 4636);
  const item = newSeasonalEnrollmentOverride("x", "y");
  item.minimum = 4637.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
