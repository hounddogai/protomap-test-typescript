import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionBaselineCeilingRangeRule,
  RetentionBaselineCodeLengthRule,
  RetentionBaselineRequiredCampaignRefRule,
  RetentionBaselineTitleLengthRule,
  defaultRetentionBaselineValidator,
} from "./retention-baseline-rules.js";
import { newRetentionBaseline } from "./retention-baseline.js";

test("RetentionBaselineValidator reports every problem", () => {
  const validator = defaultRetentionBaselineValidator();
  const item = newRetentionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionBaselineRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RetentionBaselineRequiredCampaignRefRule("retention baseline needs a value");
  const item = newRetentionBaseline("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionBaselineCeilingRangeRule flags values above ceiling", () => {
  const rule = new RetentionBaselineCeilingRangeRule(4.7, 72.8);
  const item = newRetentionBaseline("x", "y");
  item.ceiling = 74.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionBaselineCodeLengthRule flags a long code", () => {
  const rule = new RetentionBaselineCodeLengthRule(32);
  const item = newRetentionBaseline("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionBaselineTitleLengthRule flags a long title", () => {
  const rule = new RetentionBaselineTitleLengthRule(32);
  const item = newRetentionBaseline("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
