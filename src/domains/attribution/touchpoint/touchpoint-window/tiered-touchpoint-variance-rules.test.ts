import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTouchpointVarianceAmountRangeRule,
  TieredTouchpointVarianceChannelLengthRule,
  TieredTouchpointVarianceCodeLengthRule,
  defaultTieredTouchpointVarianceValidator,
} from "./tiered-touchpoint-variance-rules.js";
import { newTieredTouchpointVariance } from "./tiered-touchpoint-variance.js";

test("TieredTouchpointVarianceValidator reports every problem", () => {
  const validator = defaultTieredTouchpointVarianceValidator();
  const item = newTieredTouchpointVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTouchpointVarianceCodeLengthRule flags a long code", () => {
  const rule = new TieredTouchpointVarianceCodeLengthRule(3600);
  const item = newTieredTouchpointVariance("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTouchpointVarianceAmountRangeRule flags values above amount", () => {
  const rule = new TieredTouchpointVarianceAmountRangeRule(4.5, 4610.5);
  const item = newTieredTouchpointVariance("x", "y");
  item.amount = 4612;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredTouchpointVarianceChannelLengthRule flags a long channel", () => {
  const rule = new TieredTouchpointVarianceChannelLengthRule(255);
  const item = newTieredTouchpointVariance("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
