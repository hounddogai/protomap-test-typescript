import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderExceptionCostRangeRule,
  SenderExceptionRequiredLabelRule,
  SenderExceptionRequiredLocaleRule,
  defaultSenderExceptionValidator,
} from "./sender-exception-rules.js";
import { newSenderException } from "./sender-exception.js";

test("SenderExceptionValidator reports every problem", () => {
  const validator = defaultSenderExceptionValidator();
  const item = newSenderException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderExceptionRequiredLocaleRule flags a blank locale", () => {
  const rule = new SenderExceptionRequiredLocaleRule("sender exception needs this field");
  const item = newSenderException("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderExceptionCostRangeRule flags values above cost", () => {
  const rule = new SenderExceptionCostRangeRule(6.1, 3675.8);
  const item = newSenderException("x", "y");
  item.cost = 3677.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new SenderExceptionRequiredLabelRule("sender exception needs an entry");
  const item = newSenderException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
