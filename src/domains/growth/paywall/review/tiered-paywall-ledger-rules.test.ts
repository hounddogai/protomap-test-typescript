import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPaywallLedgerRequiredJourneyIdRule,
  TieredPaywallLedgerRequiredNameRule,
  TieredPaywallLedgerRevisionRangeRule,
  defaultTieredPaywallLedgerValidator,
} from "./tiered-paywall-ledger-rules.js";
import { newTieredPaywallLedger } from "./tiered-paywall-ledger.js";

test("TieredPaywallLedgerValidator reports every problem", () => {
  const validator = defaultTieredPaywallLedgerValidator();
  const item = newTieredPaywallLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPaywallLedgerRequiredNameRule flags a blank name", () => {
  const rule = new TieredPaywallLedgerRequiredNameRule("tiered paywall ledger needs a value");
  const item = newTieredPaywallLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPaywallLedgerRevisionRangeRule flags values above revision", () => {
  const rule = new TieredPaywallLedgerRevisionRangeRule(32, 3600);
  const item = newTieredPaywallLedger("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPaywallLedgerRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new TieredPaywallLedgerRequiredJourneyIdRule("tiered paywall ledger needs an entry");
  const item = newTieredPaywallLedger("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
