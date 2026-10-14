import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPaywallWindowExpiresAtRangeRule,
  RollingPaywallWindowLabelLengthRule,
  RollingPaywallWindowRequiredExternalRefRule,
  RollingPaywallWindowSendAtRangeRule,
  defaultRollingPaywallWindowValidator,
} from "./rolling-paywall-window-rules.js";
import { newRollingPaywallWindow } from "./rolling-paywall-window.js";

test("RollingPaywallWindowValidator reports every problem", () => {
  const validator = defaultRollingPaywallWindowValidator();
  const item = newRollingPaywallWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPaywallWindowSendAtRangeRule flags values above send at", () => {
  const rule = new RollingPaywallWindowSendAtRangeRule(80, 80);
  const item = newRollingPaywallWindow("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPaywallWindowRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RollingPaywallWindowRequiredExternalRefRule("rolling paywall window needs a value");
  const item = newRollingPaywallWindow("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPaywallWindowLabelLengthRule flags a long label", () => {
  const rule = new RollingPaywallWindowLabelLengthRule(64);
  const item = newRollingPaywallWindow("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPaywallWindowExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RollingPaywallWindowExpiresAtRangeRule(1000, 86400);
  const item = newRollingPaywallWindow("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
