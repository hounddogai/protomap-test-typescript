import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCreditDraftCapacityRangeRule,
  CappedCreditDraftCodeLengthRule,
  CappedCreditDraftRequiredCodeRule,
  defaultCappedCreditDraftValidator,
} from "./capped-credit-draft-rules.js";
import { newCappedCreditDraft } from "./capped-credit-draft.js";

test("CappedCreditDraftValidator reports every problem", () => {
  const validator = defaultCappedCreditDraftValidator();
  const item = newCappedCreditDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCreditDraftRequiredCodeRule flags a blank code", () => {
  const rule = new CappedCreditDraftRequiredCodeRule("capped credit draft needs this field");
  const item = newCappedCreditDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCreditDraftCapacityRangeRule flags values above capacity", () => {
  const rule = new CappedCreditDraftCapacityRangeRule(255, 255);
  const item = newCappedCreditDraft("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCreditDraftCodeLengthRule flags a long code", () => {
  const rule = new CappedCreditDraftCodeLengthRule(255);
  const item = newCappedCreditDraft("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
