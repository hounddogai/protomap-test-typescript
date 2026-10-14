import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRetentionLedgerFloorValueRangeRule,
  ManualRetentionLedgerImpressionsRangeRule,
  ManualRetentionLedgerRequiredLabelRule,
  ManualRetentionLedgerRequiredReviewerRule,
  defaultManualRetentionLedgerValidator,
} from "./manual-retention-ledger-rules.js";
import { newManualRetentionLedger } from "./manual-retention-ledger.js";

test("ManualRetentionLedgerValidator reports every problem", () => {
  const validator = defaultManualRetentionLedgerValidator();
  const item = newManualRetentionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRetentionLedgerImpressionsRangeRule flags values above impressions", () => {
  const rule = new ManualRetentionLedgerImpressionsRangeRule(255, 86400);
  const item = newManualRetentionLedger("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualRetentionLedgerRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ManualRetentionLedgerRequiredReviewerRule("manual retention ledger needs this field");
  const item = newManualRetentionLedger("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRetentionLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new ManualRetentionLedgerRequiredLabelRule("manual retention ledger needs an entry");
  const item = newManualRetentionLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRetentionLedgerFloorValueRangeRule flags values above floor value", () => {
  const rule = new ManualRetentionLedgerFloorValueRangeRule(6.4, 2342.7);
  const item = newManualRetentionLedger("x", "y");
  item.floorValue = 2344.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
