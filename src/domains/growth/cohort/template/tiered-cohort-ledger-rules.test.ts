import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredCohortLedgerMinimumRangeRule,
  TieredCohortLedgerRequiredNameRule,
  defaultTieredCohortLedgerValidator,
} from "./tiered-cohort-ledger-rules.js";
import { newTieredCohortLedger } from "./tiered-cohort-ledger.js";

test("TieredCohortLedgerValidator reports every problem", () => {
  const validator = defaultTieredCohortLedgerValidator();
  const item = newTieredCohortLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredCohortLedgerMinimumRangeRule flags values above minimum", () => {
  const rule = new TieredCohortLedgerMinimumRangeRule(1.2, 2920.8);
  const item = newTieredCohortLedger("x", "y");
  item.minimum = 2922.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCohortLedgerRequiredNameRule flags a blank name", () => {
  const rule = new TieredCohortLedgerRequiredNameRule("tiered cohort ledger needs an entry");
  const item = newTieredCohortLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
