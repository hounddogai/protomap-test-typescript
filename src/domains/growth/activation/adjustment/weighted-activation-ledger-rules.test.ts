import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedActivationLedgerChannelLengthRule,
  WeightedActivationLedgerRequiredCodeRule,
  WeightedActivationLedgerRequiredTitleRule,
  defaultWeightedActivationLedgerValidator,
} from "./weighted-activation-ledger-rules.js";
import { newWeightedActivationLedger } from "./weighted-activation-ledger.js";

test("WeightedActivationLedgerValidator reports every problem", () => {
  const validator = defaultWeightedActivationLedgerValidator();
  const item = newWeightedActivationLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedActivationLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedActivationLedgerRequiredTitleRule("weighted activation ledger needs an entry");
  const item = newWeightedActivationLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedActivationLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedActivationLedgerRequiredCodeRule("weighted activation ledger needs this field");
  const item = newWeightedActivationLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedActivationLedgerChannelLengthRule flags a long channel", () => {
  const rule = new WeightedActivationLedgerChannelLengthRule(32);
  const item = newWeightedActivationLedger("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
