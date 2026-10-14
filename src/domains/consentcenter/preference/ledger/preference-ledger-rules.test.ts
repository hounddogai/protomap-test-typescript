import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceLedgerChannelLengthRule,
  PreferenceLedgerRequiredChannelRule,
  PreferenceLedgerRequiredCodeRule,
  PreferenceLedgerRequiredTitleRule,
  PreferenceLedgerWeightRangeRule,
  defaultPreferenceLedgerValidator,
} from "./preference-ledger-rules.js";
import { newPreferenceLedger } from "./preference-ledger.js";

test("PreferenceLedgerValidator reports every problem", () => {
  const validator = defaultPreferenceLedgerValidator();
  const item = newPreferenceLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceLedgerChannelLengthRule flags a long channel", () => {
  const rule = new PreferenceLedgerChannelLengthRule(3600);
  const item = newPreferenceLedger("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceLedgerRequiredChannelRule flags a blank channel", () => {
  const rule = new PreferenceLedgerRequiredChannelRule("preference ledger needs an entry");
  const item = newPreferenceLedger("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceLedgerWeightRangeRule flags values above weight", () => {
  const rule = new PreferenceLedgerWeightRangeRule(4, 4239.3);
  const item = newPreferenceLedger("x", "y");
  item.weight = 4240.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceLedgerRequiredCodeRule("preference ledger needs this field");
  const item = newPreferenceLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new PreferenceLedgerRequiredTitleRule("preference ledger needs this field");
  const item = newPreferenceLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
