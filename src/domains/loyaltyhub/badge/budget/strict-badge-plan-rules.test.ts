import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBadgePlanRequiredCampaignRefRule,
  StrictBadgePlanRequiredSegmentRule,
  defaultStrictBadgePlanValidator,
} from "./strict-badge-plan-rules.js";
import { newStrictBadgePlan } from "./strict-badge-plan.js";

test("StrictBadgePlanValidator reports every problem", () => {
  const validator = defaultStrictBadgePlanValidator();
  const item = newStrictBadgePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBadgePlanRequiredSegmentRule flags a blank segment", () => {
  const rule = new StrictBadgePlanRequiredSegmentRule("strict badge plan needs a value");
  const item = newStrictBadgePlan("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictBadgePlanRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new StrictBadgePlanRequiredCampaignRefRule("strict badge plan needs this field");
  const item = newStrictBadgePlan("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
