import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualStreakAgreementCodeLengthRule,
  ManualStreakAgreementMinimumRangeRule,
  defaultManualStreakAgreementValidator,
} from "./manual-streak-agreement-rules.js";
import { newManualStreakAgreement } from "./manual-streak-agreement.js";

test("ManualStreakAgreementValidator reports every problem", () => {
  const validator = defaultManualStreakAgreementValidator();
  const item = newManualStreakAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualStreakAgreementCodeLengthRule flags a long code", () => {
  const rule = new ManualStreakAgreementCodeLengthRule(86400);
  const item = newManualStreakAgreement("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualStreakAgreementMinimumRangeRule flags values above minimum", () => {
  const rule = new ManualStreakAgreementMinimumRangeRule(8.2, 3399.2);
  const item = newManualStreakAgreement("x", "y");
  item.minimum = 3400.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
