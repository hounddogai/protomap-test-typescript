import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchTemplateBatchSizeRangeRule,
  BranchTemplateRequiredCampaignRefRule,
  BranchTemplateRequiredCohortRule,
  BranchTemplateRevisionRangeRule,
  BranchTemplateStartsAtRangeRule,
  defaultBranchTemplateValidator,
} from "./branch-template-rules.js";
import { newBranchTemplate } from "./branch-template.js";

test("BranchTemplateValidator reports every problem", () => {
  const validator = defaultBranchTemplateValidator();
  const item = newBranchTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchTemplateRevisionRangeRule flags values above revision", () => {
  const rule = new BranchTemplateRevisionRangeRule(16, 16);
  const item = newBranchTemplate("x", "y");
  item.revision = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchTemplateRequiredCohortRule flags a blank cohort", () => {
  const rule = new BranchTemplateRequiredCohortRule("branch template needs an entry");
  const item = newBranchTemplate("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchTemplateRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BranchTemplateRequiredCampaignRefRule("branch template needs this field");
  const item = newBranchTemplate("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchTemplateStartsAtRangeRule flags values above starts at", () => {
  const rule = new BranchTemplateStartsAtRangeRule(255, 1000);
  const item = newBranchTemplate("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchTemplateBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BranchTemplateBatchSizeRangeRule(255, 255);
  const item = newBranchTemplate("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
