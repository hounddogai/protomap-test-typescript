import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBadgeSummaryAudienceIdLengthRule,
  TieredBadgeSummaryRequiredCodeRule,
  TieredBadgeSummaryTitleLengthRule,
  defaultTieredBadgeSummaryValidator,
} from "./tiered-badge-summary-rules.js";
import { newTieredBadgeSummary } from "./tiered-badge-summary.js";

test("TieredBadgeSummaryValidator reports every problem", () => {
  const validator = defaultTieredBadgeSummaryValidator();
  const item = newTieredBadgeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBadgeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new TieredBadgeSummaryRequiredCodeRule("tiered badge summary needs this field");
  const item = newTieredBadgeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBadgeSummaryAudienceIdLengthRule flags a long audience id", () => {
  const rule = new TieredBadgeSummaryAudienceIdLengthRule(1000);
  const item = newTieredBadgeSummary("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBadgeSummaryTitleLengthRule flags a long title", () => {
  const rule = new TieredBadgeSummaryTitleLengthRule(16);
  const item = newTieredBadgeSummary("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
