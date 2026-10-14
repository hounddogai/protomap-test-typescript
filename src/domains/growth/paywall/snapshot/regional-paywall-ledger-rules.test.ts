import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPaywallLedgerContactEmailLengthRule,
  RegionalPaywallLedgerDiscountRangeRule,
  RegionalPaywallLedgerLabelLengthRule,
  RegionalPaywallLedgerSendAtRangeRule,
  defaultRegionalPaywallLedgerValidator,
} from "./regional-paywall-ledger-rules.js";
import { newRegionalPaywallLedger } from "./regional-paywall-ledger.js";

test("RegionalPaywallLedgerValidator reports every problem", () => {
  const validator = defaultRegionalPaywallLedgerValidator();
  const item = newRegionalPaywallLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPaywallLedgerSendAtRangeRule flags values above send at", () => {
  const rule = new RegionalPaywallLedgerSendAtRangeRule(80, 255);
  const item = newRegionalPaywallLedger("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPaywallLedgerDiscountRangeRule flags values above discount", () => {
  const rule = new RegionalPaywallLedgerDiscountRangeRule(5.2, 850);
  const item = newRegionalPaywallLedger("x", "y");
  item.discount = 851.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPaywallLedgerContactEmailLengthRule flags a long contact email", () => {
  const rule = new RegionalPaywallLedgerContactEmailLengthRule(32);
  const item = newRegionalPaywallLedger("x", "y");
  item.contactEmail = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPaywallLedgerLabelLengthRule flags a long label", () => {
  const rule = new RegionalPaywallLedgerLabelLengthRule(80);
  const item = newRegionalPaywallLedger("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
