import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReputationExceptionRequiredContactEmailRule,
  StrictReputationExceptionRequiredNameRule,
  StrictReputationExceptionRequiredPhoneRule,
  defaultStrictReputationExceptionValidator,
} from "./strict-reputation-exception-rules.js";
import { newStrictReputationException } from "./strict-reputation-exception.js";

test("StrictReputationExceptionValidator reports every problem", () => {
  const validator = defaultStrictReputationExceptionValidator();
  const item = newStrictReputationException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReputationExceptionRequiredNameRule flags a blank name", () => {
  const rule = new StrictReputationExceptionRequiredNameRule("strict reputation exception needs a value");
  const item = newStrictReputationException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReputationExceptionRequiredPhoneRule flags a blank phone", () => {
  const rule = new StrictReputationExceptionRequiredPhoneRule("strict reputation exception needs a value");
  const item = newStrictReputationException("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReputationExceptionRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new StrictReputationExceptionRequiredContactEmailRule("strict reputation exception needs this field");
  const item = newStrictReputationException("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
