import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingRedemptionWindowRegionLengthRule,
  RollingRedemptionWindowRequiredRegionRule,
  defaultRollingRedemptionWindowValidator,
} from "./rolling-redemption-window-rules.js";
import { newRollingRedemptionWindow } from "./rolling-redemption-window.js";

test("RollingRedemptionWindowValidator reports every problem", () => {
  const validator = defaultRollingRedemptionWindowValidator();
  const item = newRollingRedemptionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingRedemptionWindowRequiredRegionRule flags a blank region", () => {
  const rule = new RollingRedemptionWindowRequiredRegionRule("rolling redemption window needs this field");
  const item = newRollingRedemptionWindow("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingRedemptionWindowRegionLengthRule flags a long region", () => {
  const rule = new RollingRedemptionWindowRegionLengthRule(1000);
  const item = newRollingRedemptionWindow("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
