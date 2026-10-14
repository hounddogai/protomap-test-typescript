import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientMacroEstimateCampaignRefLengthRule,
  LenientMacroEstimateCapacityRangeRule,
  LenientMacroEstimateCodeLengthRule,
  LenientMacroEstimateNameLengthRule,
  LenientMacroEstimateWeightRangeRule,
  defaultLenientMacroEstimateValidator,
} from "./lenient-macro-estimate-rules.js";
import { newLenientMacroEstimate } from "./lenient-macro-estimate.js";

test("LenientMacroEstimateValidator reports every problem", () => {
  const validator = defaultLenientMacroEstimateValidator();
  const item = newLenientMacroEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientMacroEstimateCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LenientMacroEstimateCampaignRefLengthRule(120);
  const item = newLenientMacroEstimate("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientMacroEstimateCapacityRangeRule flags values above capacity", () => {
  const rule = new LenientMacroEstimateCapacityRangeRule(32, 3600);
  const item = newLenientMacroEstimate("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientMacroEstimateNameLengthRule flags a long name", () => {
  const rule = new LenientMacroEstimateNameLengthRule(86400);
  const item = newLenientMacroEstimate("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientMacroEstimateCodeLengthRule flags a long code", () => {
  const rule = new LenientMacroEstimateCodeLengthRule(255);
  const item = newLenientMacroEstimate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientMacroEstimateWeightRangeRule flags values above weight", () => {
  const rule = new LenientMacroEstimateWeightRangeRule(3.2, 2413.7);
  const item = newLenientMacroEstimate("x", "y");
  item.weight = 2415.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
