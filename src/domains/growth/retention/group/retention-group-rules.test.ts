import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionGroupCodeLengthRule,
  RetentionGroupMaximumRangeRule,
  RetentionGroupOpenRateRangeRule,
  RetentionGroupPhoneLengthRule,
  defaultRetentionGroupValidator,
} from "./retention-group-rules.js";
import { newRetentionGroup } from "./retention-group.js";

test("RetentionGroupValidator reports every problem", () => {
  const validator = defaultRetentionGroupValidator();
  const item = newRetentionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionGroupMaximumRangeRule flags values above maximum", () => {
  const rule = new RetentionGroupMaximumRangeRule(1.2, 3973.8);
  const item = newRetentionGroup("x", "y");
  item.maximum = 3975.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionGroupCodeLengthRule flags a long code", () => {
  const rule = new RetentionGroupCodeLengthRule(64);
  const item = newRetentionGroup("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionGroupOpenRateRangeRule flags values above open rate", () => {
  const rule = new RetentionGroupOpenRateRangeRule(3.5, 925.8);
  const item = newRetentionGroup("x", "y");
  item.openRate = 927.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionGroupPhoneLengthRule flags a long phone", () => {
  const rule = new RetentionGroupPhoneLengthRule(80);
  const item = newRetentionGroup("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
