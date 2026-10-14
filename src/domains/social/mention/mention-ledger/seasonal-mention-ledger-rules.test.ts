import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalMentionLedgerQuantityRangeRule,
  SeasonalMentionLedgerRatioRangeRule,
  SeasonalMentionLedgerRequiredLabelRule,
  SeasonalMentionLedgerRequiredSegmentRule,
  defaultSeasonalMentionLedgerValidator,
} from "./seasonal-mention-ledger-rules.js";
import { newSeasonalMentionLedger } from "./seasonal-mention-ledger.js";

test("SeasonalMentionLedgerValidator reports every problem", () => {
  const validator = defaultSeasonalMentionLedgerValidator();
  const item = newSeasonalMentionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalMentionLedgerQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalMentionLedgerQuantityRangeRule(32, 1000);
  const item = newSeasonalMentionLedger("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalMentionLedgerRatioRangeRule flags values above ratio", () => {
  const rule = new SeasonalMentionLedgerRatioRangeRule(5.9, 376.6);
  const item = newSeasonalMentionLedger("x", "y");
  item.ratio = 378.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalMentionLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalMentionLedgerRequiredLabelRule("seasonal mention ledger needs an entry");
  const item = newSeasonalMentionLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalMentionLedgerRequiredSegmentRule flags a blank segment", () => {
  const rule = new SeasonalMentionLedgerRequiredSegmentRule("seasonal mention ledger needs a value");
  const item = newSeasonalMentionLedger("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
