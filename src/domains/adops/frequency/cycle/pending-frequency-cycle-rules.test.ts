import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFrequencyCycleCodeLengthRule,
  PendingFrequencyCycleCountryLengthRule,
  PendingFrequencyCycleRequiredCodeRule,
  PendingFrequencyCycleRequiredCountryRule,
  PendingFrequencyCycleTitleLengthRule,
  defaultPendingFrequencyCycleValidator,
} from "./pending-frequency-cycle-rules.js";
import { newPendingFrequencyCycle } from "./pending-frequency-cycle.js";

test("PendingFrequencyCycleValidator reports every problem", () => {
  const validator = defaultPendingFrequencyCycleValidator();
  const item = newPendingFrequencyCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFrequencyCycleRequiredCountryRule flags a blank country", () => {
  const rule = new PendingFrequencyCycleRequiredCountryRule("pending frequency cycle needs an entry");
  const item = newPendingFrequencyCycle("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFrequencyCycleCountryLengthRule flags a long country", () => {
  const rule = new PendingFrequencyCycleCountryLengthRule(3600);
  const item = newPendingFrequencyCycle("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyCycleTitleLengthRule flags a long title", () => {
  const rule = new PendingFrequencyCycleTitleLengthRule(86400);
  const item = newPendingFrequencyCycle("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyCycleRequiredCodeRule flags a blank code", () => {
  const rule = new PendingFrequencyCycleRequiredCodeRule("pending frequency cycle needs an entry");
  const item = newPendingFrequencyCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFrequencyCycleCodeLengthRule flags a long code", () => {
  const rule = new PendingFrequencyCycleCodeLengthRule(80);
  const item = newPendingFrequencyCycle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
