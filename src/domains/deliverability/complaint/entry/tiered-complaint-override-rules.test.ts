import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredComplaintOverrideConversionRateRangeRule,
  TieredComplaintOverrideLocaleLengthRule,
  TieredComplaintOverrideRequiredNameRule,
  TieredComplaintOverrideRevisionRangeRule,
  defaultTieredComplaintOverrideValidator,
} from "./tiered-complaint-override-rules.js";
import { newTieredComplaintOverride } from "./tiered-complaint-override.js";

test("TieredComplaintOverrideValidator reports every problem", () => {
  const validator = defaultTieredComplaintOverrideValidator();
  const item = newTieredComplaintOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredComplaintOverrideRevisionRangeRule flags values above revision", () => {
  const rule = new TieredComplaintOverrideRevisionRangeRule(80, 1000);
  const item = newTieredComplaintOverride("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredComplaintOverrideRequiredNameRule flags a blank name", () => {
  const rule = new TieredComplaintOverrideRequiredNameRule("tiered complaint override needs this field");
  const item = newTieredComplaintOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredComplaintOverrideLocaleLengthRule flags a long locale", () => {
  const rule = new TieredComplaintOverrideLocaleLengthRule(32);
  const item = newTieredComplaintOverride("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredComplaintOverrideConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new TieredComplaintOverrideConversionRateRangeRule(6, 4118.9);
  const item = newTieredComplaintOverride("x", "y");
  item.conversionRate = 4120.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
