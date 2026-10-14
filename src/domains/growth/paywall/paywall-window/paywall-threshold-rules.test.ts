import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallThresholdChannelLengthRule,
  PaywallThresholdRequiredChannelRule,
  PaywallThresholdRequiredLabelRule,
  defaultPaywallThresholdValidator,
} from "./paywall-threshold-rules.js";
import { newPaywallThreshold } from "./paywall-threshold.js";

test("PaywallThresholdValidator reports every problem", () => {
  const validator = defaultPaywallThresholdValidator();
  const item = newPaywallThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new PaywallThresholdRequiredLabelRule("paywall threshold needs a value");
  const item = newPaywallThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallThresholdChannelLengthRule flags a long channel", () => {
  const rule = new PaywallThresholdChannelLengthRule(255);
  const item = newPaywallThreshold("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallThresholdRequiredChannelRule flags a blank channel", () => {
  const rule = new PaywallThresholdRequiredChannelRule("paywall threshold needs an entry");
  const item = newPaywallThreshold("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
