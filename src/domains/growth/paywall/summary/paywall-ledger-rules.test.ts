import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallLedgerMarginRangeRule,
  PaywallLedgerRequiredCategoryRule,
  PaywallLedgerTitleLengthRule,
  defaultPaywallLedgerValidator,
} from "./paywall-ledger-rules.js";
import { newPaywallLedger } from "./paywall-ledger.js";

test("PaywallLedgerValidator reports every problem", () => {
  const validator = defaultPaywallLedgerValidator();
  const item = newPaywallLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallLedgerTitleLengthRule flags a long title", () => {
  const rule = new PaywallLedgerTitleLengthRule(86400);
  const item = newPaywallLedger("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallLedgerMarginRangeRule flags values above margin", () => {
  const rule = new PaywallLedgerMarginRangeRule(1.8, 1921.6);
  const item = newPaywallLedger("x", "y");
  item.margin = 1923.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallLedgerRequiredCategoryRule flags a blank category", () => {
  const rule = new PaywallLedgerRequiredCategoryRule("paywall ledger needs this field");
  const item = newPaywallLedger("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
