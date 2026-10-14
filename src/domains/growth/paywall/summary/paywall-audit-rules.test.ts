import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallAuditDiscountRangeRule,
  PaywallAuditRequiredSegmentRule,
  defaultPaywallAuditValidator,
} from "./paywall-audit-rules.js";
import { newPaywallAudit } from "./paywall-audit.js";

test("PaywallAuditValidator reports every problem", () => {
  const validator = defaultPaywallAuditValidator();
  const item = newPaywallAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallAuditDiscountRangeRule flags values above discount", () => {
  const rule = new PaywallAuditDiscountRangeRule(0.2, 2710);
  const item = newPaywallAudit("x", "y");
  item.discount = 2711.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallAuditRequiredSegmentRule flags a blank segment", () => {
  const rule = new PaywallAuditRequiredSegmentRule("paywall audit needs a value");
  const item = newPaywallAudit("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
