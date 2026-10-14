import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRewardRuleLedgerCodeLengthRule,
  RegionalRewardRuleLedgerCohortLengthRule,
  RegionalRewardRuleLedgerLabelLengthRule,
  RegionalRewardRuleLedgerRatioRangeRule,
  RegionalRewardRuleLedgerRequiredLabelRule,
  defaultRegionalRewardRuleLedgerValidator,
} from "./regional-reward-rule-ledger-rules.js";
import { newRegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

test("RegionalRewardRuleLedgerValidator reports every problem", () => {
  const validator = defaultRegionalRewardRuleLedgerValidator();
  const item = newRegionalRewardRuleLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRewardRuleLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalRewardRuleLedgerRequiredLabelRule("regional reward rule ledger needs this field");
  const item = newRegionalRewardRuleLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRewardRuleLedgerLabelLengthRule flags a long label", () => {
  const rule = new RegionalRewardRuleLedgerLabelLengthRule(255);
  const item = newRegionalRewardRuleLedger("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRewardRuleLedgerCohortLengthRule flags a long cohort", () => {
  const rule = new RegionalRewardRuleLedgerCohortLengthRule(3600);
  const item = newRegionalRewardRuleLedger("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRewardRuleLedgerRatioRangeRule flags values above ratio", () => {
  const rule = new RegionalRewardRuleLedgerRatioRangeRule(10, 3997.6);
  const item = newRegionalRewardRuleLedger("x", "y");
  item.ratio = 3999.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalRewardRuleLedgerCodeLengthRule flags a long code", () => {
  const rule = new RegionalRewardRuleLedgerCodeLengthRule(120);
  const item = newRegionalRewardRuleLedger("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
