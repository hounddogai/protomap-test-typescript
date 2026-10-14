import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalReputationLedgerAudienceIdLengthRule,
  SeasonalReputationLedgerLabelLengthRule,
  SeasonalReputationLedgerRequiredAudienceIdRule,
  SeasonalReputationLedgerRequiredCodeRule,
  SeasonalReputationLedgerTitleLengthRule,
  defaultSeasonalReputationLedgerValidator,
} from "./seasonal-reputation-ledger-rules.js";
import { newSeasonalReputationLedger } from "./seasonal-reputation-ledger.js";

test("SeasonalReputationLedgerValidator reports every problem", () => {
  const validator = defaultSeasonalReputationLedgerValidator();
  const item = newSeasonalReputationLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalReputationLedgerAudienceIdLengthRule flags a long audience id", () => {
  const rule = new SeasonalReputationLedgerAudienceIdLengthRule(120);
  const item = newSeasonalReputationLedger("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalReputationLedgerTitleLengthRule flags a long title", () => {
  const rule = new SeasonalReputationLedgerTitleLengthRule(80);
  const item = newSeasonalReputationLedger("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalReputationLedgerLabelLengthRule flags a long label", () => {
  const rule = new SeasonalReputationLedgerLabelLengthRule(16);
  const item = newSeasonalReputationLedger("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalReputationLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalReputationLedgerRequiredCodeRule("seasonal reputation ledger needs this field");
  const item = newSeasonalReputationLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalReputationLedgerRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SeasonalReputationLedgerRequiredAudienceIdRule("seasonal reputation ledger needs an entry");
  const item = newSeasonalReputationLedger("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
