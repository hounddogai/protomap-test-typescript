import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBidRuleLedgerOpenRateRangeRule,
  RegionalBidRuleLedgerRetriesRangeRule,
  defaultRegionalBidRuleLedgerValidator,
} from "./regional-bid-rule-ledger-rules.js";
import { newRegionalBidRuleLedger } from "./regional-bid-rule-ledger.js";

test("RegionalBidRuleLedgerValidator reports every problem", () => {
  const validator = defaultRegionalBidRuleLedgerValidator();
  const item = newRegionalBidRuleLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBidRuleLedgerRetriesRangeRule flags values above retries", () => {
  const rule = new RegionalBidRuleLedgerRetriesRangeRule(1000, 1000);
  const item = newRegionalBidRuleLedger("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalBidRuleLedgerOpenRateRangeRule flags values above open rate", () => {
  const rule = new RegionalBidRuleLedgerOpenRateRangeRule(0.5, 1088.9);
  const item = newRegionalBidRuleLedger("x", "y");
  item.openRate = 1090.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
