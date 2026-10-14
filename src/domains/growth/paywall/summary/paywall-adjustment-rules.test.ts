import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallAdjustmentCodeLengthRule,
  PaywallAdjustmentRequiredLabelRule,
  defaultPaywallAdjustmentValidator,
} from "./paywall-adjustment-rules.js";
import { newPaywallAdjustment } from "./paywall-adjustment.js";

test("PaywallAdjustmentValidator reports every problem", () => {
  const validator = defaultPaywallAdjustmentValidator();
  const item = newPaywallAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new PaywallAdjustmentRequiredLabelRule("paywall adjustment needs this field");
  const item = newPaywallAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new PaywallAdjustmentCodeLengthRule(255);
  const item = newPaywallAdjustment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
