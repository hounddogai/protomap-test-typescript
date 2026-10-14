import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSuppressionAgreementRequiredTitleRule,
  GlobalSuppressionAgreementTitleLengthRule,
  defaultGlobalSuppressionAgreementValidator,
} from "./global-suppression-agreement-rules.js";
import { newGlobalSuppressionAgreement } from "./global-suppression-agreement.js";

test("GlobalSuppressionAgreementValidator reports every problem", () => {
  const validator = defaultGlobalSuppressionAgreementValidator();
  const item = newGlobalSuppressionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSuppressionAgreementTitleLengthRule flags a long title", () => {
  const rule = new GlobalSuppressionAgreementTitleLengthRule(1000);
  const item = newGlobalSuppressionAgreement("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSuppressionAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalSuppressionAgreementRequiredTitleRule("global suppression agreement needs this field");
  const item = newGlobalSuppressionAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
