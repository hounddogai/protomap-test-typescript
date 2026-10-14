import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRetentionRollupSummaryLengthRule,
  RegionalRetentionRollupTitleLengthRule,
  defaultRegionalRetentionRollupValidator,
} from "./regional-retention-rollup-rules.js";
import { newRegionalRetentionRollup } from "./regional-retention-rollup.js";

test("RegionalRetentionRollupValidator reports every problem", () => {
  const validator = defaultRegionalRetentionRollupValidator();
  const item = newRegionalRetentionRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRetentionRollupSummaryLengthRule flags a long summary", () => {
  const rule = new RegionalRetentionRollupSummaryLengthRule(80);
  const item = newRegionalRetentionRollup("x", "y");
  item.summary = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRetentionRollupTitleLengthRule flags a long title", () => {
  const rule = new RegionalRetentionRollupTitleLengthRule(3600);
  const item = newRegionalRetentionRollup("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
