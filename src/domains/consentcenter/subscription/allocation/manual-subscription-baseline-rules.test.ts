import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSubscriptionBaselineAmountRangeRule,
  ManualSubscriptionBaselineCodeLengthRule,
  defaultManualSubscriptionBaselineValidator,
} from "./manual-subscription-baseline-rules.js";
import { newManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

test("ManualSubscriptionBaselineValidator reports every problem", () => {
  const validator = defaultManualSubscriptionBaselineValidator();
  const item = newManualSubscriptionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSubscriptionBaselineCodeLengthRule flags a long code", () => {
  const rule = new ManualSubscriptionBaselineCodeLengthRule(80);
  const item = newManualSubscriptionBaseline("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualSubscriptionBaselineAmountRangeRule flags values above amount", () => {
  const rule = new ManualSubscriptionBaselineAmountRangeRule(5.4, 1407.6);
  const item = newManualSubscriptionBaseline("x", "y");
  item.amount = 1409.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
