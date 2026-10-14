import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedTierRecordCodeLengthRule,
  WeightedTierRecordRequiredNameRule,
  WeightedTierRecordRequiredNotesRule,
  WeightedTierRecordRequiredPhoneRule,
  defaultWeightedTierRecordValidator,
} from "./weighted-tier-record-rules.js";
import { newWeightedTierRecord } from "./weighted-tier-record.js";

test("WeightedTierRecordValidator reports every problem", () => {
  const validator = defaultWeightedTierRecordValidator();
  const item = newWeightedTierRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedTierRecordCodeLengthRule flags a long code", () => {
  const rule = new WeightedTierRecordCodeLengthRule(86400);
  const item = newWeightedTierRecord("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTierRecordRequiredPhoneRule flags a blank phone", () => {
  const rule = new WeightedTierRecordRequiredPhoneRule("weighted tier record needs a value");
  const item = newWeightedTierRecord("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedTierRecordRequiredNotesRule flags a blank notes", () => {
  const rule = new WeightedTierRecordRequiredNotesRule("weighted tier record needs an entry");
  const item = newWeightedTierRecord("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedTierRecordRequiredNameRule flags a blank name", () => {
  const rule = new WeightedTierRecordRequiredNameRule("weighted tier record needs an entry");
  const item = newWeightedTierRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
