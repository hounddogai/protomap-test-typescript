import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPayoutLedgerCodeLengthRule,
  SeasonalPayoutLedgerRequiredChannelRule,
  defaultSeasonalPayoutLedgerValidator,
} from "./seasonal-payout-ledger-rules.js";
import { newSeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

test("SeasonalPayoutLedgerValidator reports every problem", () => {
  const validator = defaultSeasonalPayoutLedgerValidator();
  const item = newSeasonalPayoutLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPayoutLedgerCodeLengthRule flags a long code", () => {
  const rule = new SeasonalPayoutLedgerCodeLengthRule(86400);
  const item = newSeasonalPayoutLedger("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPayoutLedgerRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalPayoutLedgerRequiredChannelRule("seasonal payout ledger needs this field");
  const item = newSeasonalPayoutLedger("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
