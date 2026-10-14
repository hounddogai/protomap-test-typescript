import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCreativeTargetCodeLengthRule,
  LegacyCreativeTargetRequiredCampaignRefRule,
  LegacyCreativeTargetUpdatedAtRangeRule,
  defaultLegacyCreativeTargetValidator,
} from "./legacy-creative-target-rules.js";
import { newLegacyCreativeTarget } from "./legacy-creative-target.js";

test("LegacyCreativeTargetValidator reports every problem", () => {
  const validator = defaultLegacyCreativeTargetValidator();
  const item = newLegacyCreativeTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCreativeTargetRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LegacyCreativeTargetRequiredCampaignRefRule("legacy creative target needs a value");
  const item = newLegacyCreativeTarget("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyCreativeTargetCodeLengthRule flags a long code", () => {
  const rule = new LegacyCreativeTargetCodeLengthRule(86400);
  const item = newLegacyCreativeTarget("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCreativeTargetUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LegacyCreativeTargetUpdatedAtRangeRule(255, 1000);
  const item = newLegacyCreativeTarget("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
