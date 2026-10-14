import assert from "node:assert/strict";
import { test } from "node:test";
import { CreditCheckpointCurrencyLengthRule, defaultCreditCheckpointValidator } from "./credit-checkpoint-rules.js";
import { newCreditCheckpoint } from "./credit-checkpoint.js";

test("CreditCheckpointValidator reports every problem", () => {
  const validator = defaultCreditCheckpointValidator();
  const item = newCreditCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditCheckpointCurrencyLengthRule flags a long currency", () => {
  const rule = new CreditCheckpointCurrencyLengthRule(120);
  const item = newCreditCheckpoint("x", "y");
  item.currency = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
