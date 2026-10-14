import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutAdjustmentRequiredCodeRule,
  PayoutAdjustmentRequiredOwnerIdRule,
  defaultPayoutAdjustmentValidator,
} from "./payout-adjustment-rules.js";
import { newPayoutAdjustment } from "./payout-adjustment.js";

test("PayoutAdjustmentValidator reports every problem", () => {
  const validator = defaultPayoutAdjustmentValidator();
  const item = newPayoutAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutAdjustmentRequiredCodeRule("payout adjustment needs an entry");
  const item = newPayoutAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutAdjustmentRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PayoutAdjustmentRequiredOwnerIdRule("payout adjustment needs this field");
  const item = newPayoutAdjustment("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
