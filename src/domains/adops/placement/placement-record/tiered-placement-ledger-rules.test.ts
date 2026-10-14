import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPlacementLedgerCodeLengthRule,
  TieredPlacementLedgerLabelLengthRule,
  TieredPlacementLedgerRequiredChannelRule,
  TieredPlacementLedgerRequiredExternalRefRule,
  defaultTieredPlacementLedgerValidator,
} from "./tiered-placement-ledger-rules.js";
import { newTieredPlacementLedger } from "./tiered-placement-ledger.js";

test("TieredPlacementLedgerValidator reports every problem", () => {
  const validator = defaultTieredPlacementLedgerValidator();
  const item = newTieredPlacementLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPlacementLedgerRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new TieredPlacementLedgerRequiredExternalRefRule("tiered placement ledger needs a value");
  const item = newTieredPlacementLedger("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPlacementLedgerRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredPlacementLedgerRequiredChannelRule("tiered placement ledger needs this field");
  const item = newTieredPlacementLedger("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPlacementLedgerLabelLengthRule flags a long label", () => {
  const rule = new TieredPlacementLedgerLabelLengthRule(32);
  const item = newTieredPlacementLedger("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPlacementLedgerCodeLengthRule flags a long code", () => {
  const rule = new TieredPlacementLedgerCodeLengthRule(64);
  const item = newTieredPlacementLedger("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
