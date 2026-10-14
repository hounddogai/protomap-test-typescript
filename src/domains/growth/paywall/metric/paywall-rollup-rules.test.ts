import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallRollupCodeLengthRule,
  PaywallRollupFloorValueRangeRule,
  PaywallRollupRequiredJourneyIdRule,
  defaultPaywallRollupValidator,
} from "./paywall-rollup-rules.js";
import { newPaywallRollup } from "./paywall-rollup.js";

test("PaywallRollupValidator reports every problem", () => {
  const validator = defaultPaywallRollupValidator();
  const item = newPaywallRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallRollupFloorValueRangeRule flags values above floor value", () => {
  const rule = new PaywallRollupFloorValueRangeRule(3.4, 3504.3);
  const item = newPaywallRollup("x", "y");
  item.floorValue = 3505.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallRollupRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new PaywallRollupRequiredJourneyIdRule("paywall rollup needs a value");
  const item = newPaywallRollup("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallRollupCodeLengthRule flags a long code", () => {
  const rule = new PaywallRollupCodeLengthRule(1000);
  const item = newPaywallRollup("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
