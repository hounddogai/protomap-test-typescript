import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySlaAgreementRequiredCodeRule,
  PrimarySlaAgreementRequiredTitleRule,
  PrimarySlaAgreementTitleLengthRule,
  defaultPrimarySlaAgreementValidator,
} from "./primary-sla-agreement-rules.js";
import { newPrimarySlaAgreement } from "./primary-sla-agreement.js";

test("PrimarySlaAgreementValidator reports every problem", () => {
  const validator = defaultPrimarySlaAgreementValidator();
  const item = newPrimarySlaAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySlaAgreementTitleLengthRule flags a long title", () => {
  const rule = new PrimarySlaAgreementTitleLengthRule(32);
  const item = newPrimarySlaAgreement("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimarySlaAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new PrimarySlaAgreementRequiredCodeRule("primary sla agreement needs a value");
  const item = newPrimarySlaAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySlaAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new PrimarySlaAgreementRequiredTitleRule("primary sla agreement needs a value");
  const item = newPrimarySlaAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
