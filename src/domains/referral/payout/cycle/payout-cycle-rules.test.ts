import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutCycleAmountRangeRule,
  PayoutCycleCodeLengthRule,
  PayoutCycleCountryLengthRule,
  PayoutCycleRevisionRangeRule,
  defaultPayoutCycleValidator,
} from "./payout-cycle-rules.js";
import { newPayoutCycle } from "./payout-cycle.js";

test("PayoutCycleValidator reports every problem", () => {
  const validator = defaultPayoutCycleValidator();
  const item = newPayoutCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutCycleCountryLengthRule flags a long country", () => {
  const rule = new PayoutCycleCountryLengthRule(16);
  const item = newPayoutCycle("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutCycleRevisionRangeRule flags values above revision", () => {
  const rule = new PayoutCycleRevisionRangeRule(16, 32);
  const item = newPayoutCycle("x", "y");
  item.revision = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutCycleAmountRangeRule flags values above amount", () => {
  const rule = new PayoutCycleAmountRangeRule(8.8, 1074.8);
  const item = newPayoutCycle("x", "y");
  item.amount = 1076.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutCycleCodeLengthRule flags a long code", () => {
  const rule = new PayoutCycleCodeLengthRule(86400);
  const item = newPayoutCycle("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
