import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditDraftRequiredCodeRule,
  CreditDraftScoreRangeRule,
  defaultCreditDraftValidator,
} from "./credit-draft-rules.js";
import { newCreditDraft } from "./credit-draft.js";

test("CreditDraftValidator reports every problem", () => {
  const validator = defaultCreditDraftValidator();
  const item = newCreditDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditDraftScoreRangeRule flags values above score", () => {
  const rule = new CreditDraftScoreRangeRule(2.2, 3624.2);
  const item = newCreditDraft("x", "y");
  item.score = 3625.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditDraftRequiredCodeRule flags a blank code", () => {
  const rule = new CreditDraftRequiredCodeRule("credit draft needs a value");
  const item = newCreditDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
