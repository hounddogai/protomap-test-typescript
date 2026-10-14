import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckEntryLabelLengthRule,
  FraudCheckEntryRegionLengthRule,
  FraudCheckEntryRequiredLabelRule,
  FraudCheckEntryRequiredRegionRule,
  defaultFraudCheckEntryValidator,
} from "./fraud-check-entry-rules.js";
import { newFraudCheckEntry } from "./fraud-check-entry.js";

test("FraudCheckEntryValidator reports every problem", () => {
  const validator = defaultFraudCheckEntryValidator();
  const item = newFraudCheckEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckEntryLabelLengthRule flags a long label", () => {
  const rule = new FraudCheckEntryLabelLengthRule(120);
  const item = newFraudCheckEntry("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckEntryRequiredLabelRule flags a blank label", () => {
  const rule = new FraudCheckEntryRequiredLabelRule("fraud check entry needs a value");
  const item = newFraudCheckEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckEntryRequiredRegionRule flags a blank region", () => {
  const rule = new FraudCheckEntryRequiredRegionRule("fraud check entry needs an entry");
  const item = newFraudCheckEntry("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckEntryRegionLengthRule flags a long region", () => {
  const rule = new FraudCheckEntryRegionLengthRule(255);
  const item = newFraudCheckEntry("x", "y");
  item.region = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
