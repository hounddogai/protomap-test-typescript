import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPaywallLedgerCodeLengthRule,
  SeasonalPaywallLedgerRequiredCodeRule,
  SeasonalPaywallLedgerRequiredTitleRule,
  SeasonalPaywallLedgerSummaryLengthRule,
  defaultSeasonalPaywallLedgerValidator,
} from "./seasonal-paywall-ledger-rules.js";
import { newSeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

test("SeasonalPaywallLedgerValidator reports every problem", () => {
  const validator = defaultSeasonalPaywallLedgerValidator();
  const item = newSeasonalPaywallLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPaywallLedgerCodeLengthRule flags a long code", () => {
  const rule = new SeasonalPaywallLedgerCodeLengthRule(16);
  const item = newSeasonalPaywallLedger("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPaywallLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalPaywallLedgerRequiredCodeRule("seasonal paywall ledger needs this field");
  const item = newSeasonalPaywallLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPaywallLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalPaywallLedgerRequiredTitleRule("seasonal paywall ledger needs this field");
  const item = newSeasonalPaywallLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPaywallLedgerSummaryLengthRule flags a long summary", () => {
  const rule = new SeasonalPaywallLedgerSummaryLengthRule(1000);
  const item = newSeasonalPaywallLedger("x", "y");
  item.summary = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
