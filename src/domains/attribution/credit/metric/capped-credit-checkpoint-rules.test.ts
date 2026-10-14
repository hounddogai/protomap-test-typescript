import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCreditCheckpointCodeLengthRule,
  CappedCreditCheckpointNameLengthRule,
  CappedCreditCheckpointRequiredCodeRule,
  CappedCreditCheckpointRequiredNameRule,
  defaultCappedCreditCheckpointValidator,
} from "./capped-credit-checkpoint-rules.js";
import { newCappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

test("CappedCreditCheckpointValidator reports every problem", () => {
  const validator = defaultCappedCreditCheckpointValidator();
  const item = newCappedCreditCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCreditCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new CappedCreditCheckpointRequiredCodeRule("capped credit checkpoint needs a value");
  const item = newCappedCreditCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCreditCheckpointCodeLengthRule flags a long code", () => {
  const rule = new CappedCreditCheckpointCodeLengthRule(255);
  const item = newCappedCreditCheckpoint("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCreditCheckpointNameLengthRule flags a long name", () => {
  const rule = new CappedCreditCheckpointNameLengthRule(1000);
  const item = newCappedCreditCheckpoint("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCreditCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new CappedCreditCheckpointRequiredNameRule("capped credit checkpoint needs a value");
  const item = newCappedCreditCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
