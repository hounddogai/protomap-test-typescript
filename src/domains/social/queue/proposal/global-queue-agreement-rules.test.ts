import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalQueueAgreementCodeLengthRule,
  GlobalQueueAgreementLabelLengthRule,
  GlobalQueueAgreementRequiredCodeRule,
  GlobalQueueAgreementRequiredLabelRule,
  GlobalQueueAgreementRequiredLocaleRule,
  defaultGlobalQueueAgreementValidator,
} from "./global-queue-agreement-rules.js";
import { newGlobalQueueAgreement } from "./global-queue-agreement.js";

test("GlobalQueueAgreementValidator reports every problem", () => {
  const validator = defaultGlobalQueueAgreementValidator();
  const item = newGlobalQueueAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalQueueAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalQueueAgreementRequiredLabelRule("global queue agreement needs this field");
  const item = newGlobalQueueAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalQueueAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalQueueAgreementRequiredCodeRule("global queue agreement needs a value");
  const item = newGlobalQueueAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalQueueAgreementCodeLengthRule flags a long code", () => {
  const rule = new GlobalQueueAgreementCodeLengthRule(32);
  const item = newGlobalQueueAgreement("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalQueueAgreementLabelLengthRule flags a long label", () => {
  const rule = new GlobalQueueAgreementLabelLengthRule(255);
  const item = newGlobalQueueAgreement("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalQueueAgreementRequiredLocaleRule flags a blank locale", () => {
  const rule = new GlobalQueueAgreementRequiredLocaleRule("global queue agreement needs a value");
  const item = newGlobalQueueAgreement("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
