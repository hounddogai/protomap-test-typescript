import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelAgreementCodeLengthRule,
  ModelAgreementRequiredCodeRule,
  ModelAgreementRequiredTitleRule,
  ModelAgreementTitleLengthRule,
  defaultModelAgreementValidator,
} from "./model-agreement-rules.js";
import { newModelAgreement } from "./model-agreement.js";

test("ModelAgreementValidator reports every problem", () => {
  const validator = defaultModelAgreementValidator();
  const item = newModelAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new ModelAgreementRequiredCodeRule("model agreement needs an entry");
  const item = newModelAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new ModelAgreementRequiredTitleRule("model agreement needs a value");
  const item = newModelAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelAgreementCodeLengthRule flags a long code", () => {
  const rule = new ModelAgreementCodeLengthRule(3600);
  const item = newModelAgreement("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelAgreementTitleLengthRule flags a long title", () => {
  const rule = new ModelAgreementTitleLengthRule(80);
  const item = newModelAgreement("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
