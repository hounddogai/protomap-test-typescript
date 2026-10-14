import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationOverrideAmountRangeRule,
  ReputationOverrideCodeLengthRule,
  ReputationOverrideDiscountRangeRule,
  ReputationOverrideRequiredLabelRule,
  defaultReputationOverrideValidator,
} from "./reputation-override-rules.js";
import { newReputationOverride } from "./reputation-override.js";

test("ReputationOverrideValidator reports every problem", () => {
  const validator = defaultReputationOverrideValidator();
  const item = newReputationOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new ReputationOverrideRequiredLabelRule("reputation override needs this field");
  const item = newReputationOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationOverrideDiscountRangeRule flags values above discount", () => {
  const rule = new ReputationOverrideDiscountRangeRule(9.4, 3768.6);
  const item = newReputationOverride("x", "y");
  item.discount = 3770.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationOverrideAmountRangeRule flags values above amount", () => {
  const rule = new ReputationOverrideAmountRangeRule(1.2, 4669.3);
  const item = newReputationOverride("x", "y");
  item.amount = 4670.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationOverrideCodeLengthRule flags a long code", () => {
  const rule = new ReputationOverrideCodeLengthRule(1000);
  const item = newReputationOverride("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
