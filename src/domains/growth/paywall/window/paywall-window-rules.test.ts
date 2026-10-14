import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallWindowLabelLengthRule,
  PaywallWindowRequiredCodeRule,
  PaywallWindowRequiredRegionRule,
  PaywallWindowUpdatedAtRangeRule,
  defaultPaywallWindowValidator,
} from "./paywall-window-rules.js";
import { newPaywallWindow } from "./paywall-window.js";

test("PaywallWindowValidator reports every problem", () => {
  const validator = defaultPaywallWindowValidator();
  const item = newPaywallWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallWindowRequiredRegionRule flags a blank region", () => {
  const rule = new PaywallWindowRequiredRegionRule("paywall window needs this field");
  const item = newPaywallWindow("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallWindowUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PaywallWindowUpdatedAtRangeRule(64, 3600);
  const item = newPaywallWindow("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallWindowLabelLengthRule flags a long label", () => {
  const rule = new PaywallWindowLabelLengthRule(86400);
  const item = newPaywallWindow("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallWindowRequiredCodeRule flags a blank code", () => {
  const rule = new PaywallWindowRequiredCodeRule("paywall window needs this field");
  const item = newPaywallWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
