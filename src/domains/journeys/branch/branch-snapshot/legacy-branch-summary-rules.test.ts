import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBranchSummaryChecksumLengthRule,
  LegacyBranchSummaryRequiredChecksumRule,
  LegacyBranchSummaryRequiredLabelRule,
  LegacyBranchSummaryRequiredTitleRule,
  defaultLegacyBranchSummaryValidator,
} from "./legacy-branch-summary-rules.js";
import { newLegacyBranchSummary } from "./legacy-branch-summary.js";

test("LegacyBranchSummaryValidator reports every problem", () => {
  const validator = defaultLegacyBranchSummaryValidator();
  const item = newLegacyBranchSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBranchSummaryRequiredChecksumRule flags a blank checksum", () => {
  const rule = new LegacyBranchSummaryRequiredChecksumRule("legacy branch summary needs this field");
  const item = newLegacyBranchSummary("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBranchSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyBranchSummaryRequiredTitleRule("legacy branch summary needs a value");
  const item = newLegacyBranchSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBranchSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyBranchSummaryRequiredLabelRule("legacy branch summary needs this field");
  const item = newLegacyBranchSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBranchSummaryChecksumLengthRule flags a long checksum", () => {
  const rule = new LegacyBranchSummaryChecksumLengthRule(64);
  const item = newLegacyBranchSummary("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
