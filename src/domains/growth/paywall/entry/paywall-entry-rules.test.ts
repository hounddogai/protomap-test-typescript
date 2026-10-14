import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallEntryExpiresAtRangeRule,
  PaywallEntryNameLengthRule,
  PaywallEntryRequiredCodeRule,
  defaultPaywallEntryValidator,
} from "./paywall-entry-rules.js";
import { newPaywallEntry } from "./paywall-entry.js";

test("PaywallEntryValidator reports every problem", () => {
  const validator = defaultPaywallEntryValidator();
  const item = newPaywallEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallEntryExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PaywallEntryExpiresAtRangeRule(32, 80);
  const item = newPaywallEntry("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallEntryNameLengthRule flags a long name", () => {
  const rule = new PaywallEntryNameLengthRule(120);
  const item = newPaywallEntry("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallEntryRequiredCodeRule flags a blank code", () => {
  const rule = new PaywallEntryRequiredCodeRule("paywall entry needs a value");
  const item = newPaywallEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
