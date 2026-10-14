import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCreativeAllocationAudienceIdLengthRule,
  StrictCreativeAllocationCampaignRefLengthRule,
  defaultStrictCreativeAllocationValidator,
} from "./strict-creative-allocation-rules.js";
import { newStrictCreativeAllocation } from "./strict-creative-allocation.js";

test("StrictCreativeAllocationValidator reports every problem", () => {
  const validator = defaultStrictCreativeAllocationValidator();
  const item = newStrictCreativeAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCreativeAllocationCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new StrictCreativeAllocationCampaignRefLengthRule(86400);
  const item = newStrictCreativeAllocation("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreativeAllocationAudienceIdLengthRule flags a long audience id", () => {
  const rule = new StrictCreativeAllocationAudienceIdLengthRule(80);
  const item = newStrictCreativeAllocation("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
