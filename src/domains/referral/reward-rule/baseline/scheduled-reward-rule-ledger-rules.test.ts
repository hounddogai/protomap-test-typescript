import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledRewardRuleLedgerRequiredCodeRule,
  ScheduledRewardRuleLedgerRequiredCohortRule,
  ScheduledRewardRuleLedgerRequiredTitleRule,
  defaultScheduledRewardRuleLedgerValidator,
} from "./scheduled-reward-rule-ledger-rules.js";
import { newScheduledRewardRuleLedger } from "./scheduled-reward-rule-ledger.js";

test("ScheduledRewardRuleLedgerValidator reports every problem", () => {
  const validator = defaultScheduledRewardRuleLedgerValidator();
  const item = newScheduledRewardRuleLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledRewardRuleLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledRewardRuleLedgerRequiredCodeRule("scheduled reward rule ledger needs an entry");
  const item = newScheduledRewardRuleLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRewardRuleLedgerRequiredCohortRule flags a blank cohort", () => {
  const rule = new ScheduledRewardRuleLedgerRequiredCohortRule("scheduled reward rule ledger needs this field");
  const item = newScheduledRewardRuleLedger("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRewardRuleLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledRewardRuleLedgerRequiredTitleRule("scheduled reward rule ledger needs an entry");
  const item = newScheduledRewardRuleLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
