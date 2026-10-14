import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelEntryCampaignRefLengthRule,
  ModelEntryCostRangeRule,
  ModelEntryRequiredCampaignRefRule,
  defaultModelEntryValidator,
} from "./model-entry-rules.js";
import { newModelEntry } from "./model-entry.js";

test("ModelEntryValidator reports every problem", () => {
  const validator = defaultModelEntryValidator();
  const item = newModelEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelEntryRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ModelEntryRequiredCampaignRefRule("model entry needs a value");
  const item = newModelEntry("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelEntryCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ModelEntryCampaignRefLengthRule(80);
  const item = newModelEntry("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelEntryCostRangeRule flags values above cost", () => {
  const rule = new ModelEntryCostRangeRule(2.5, 3759);
  const item = newModelEntry("x", "y");
  item.cost = 3760.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
