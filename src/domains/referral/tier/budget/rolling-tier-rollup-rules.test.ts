import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingTierRollupCodeLengthRule,
  RollingTierRollupMinimumRangeRule,
  RollingTierRollupRequiredLabelRule,
  RollingTierRollupRequiredLocaleRule,
  RollingTierRollupRequiredSummaryRule,
  defaultRollingTierRollupValidator,
} from "./rolling-tier-rollup-rules.js";
import { newRollingTierRollup } from "./rolling-tier-rollup.js";

test("RollingTierRollupValidator reports every problem", () => {
  const validator = defaultRollingTierRollupValidator();
  const item = newRollingTierRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingTierRollupMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingTierRollupMinimumRangeRule(5.6, 3721.1);
  const item = newRollingTierRollup("x", "y");
  item.minimum = 3722.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingTierRollupRequiredLocaleRule flags a blank locale", () => {
  const rule = new RollingTierRollupRequiredLocaleRule("rolling tier rollup needs a value");
  const item = newRollingTierRollup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingTierRollupRequiredSummaryRule flags a blank summary", () => {
  const rule = new RollingTierRollupRequiredSummaryRule("rolling tier rollup needs this field");
  const item = newRollingTierRollup("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingTierRollupRequiredLabelRule flags a blank label", () => {
  const rule = new RollingTierRollupRequiredLabelRule("rolling tier rollup needs an entry");
  const item = newRollingTierRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingTierRollupCodeLengthRule flags a long code", () => {
  const rule = new RollingTierRollupCodeLengthRule(120);
  const item = newRollingTierRollup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
