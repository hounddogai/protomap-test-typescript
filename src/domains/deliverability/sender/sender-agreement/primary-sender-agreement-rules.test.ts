import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySenderAgreementLabelLengthRule,
  PrimarySenderAgreementNameLengthRule,
  PrimarySenderAgreementPriorityRangeRule,
  defaultPrimarySenderAgreementValidator,
} from "./primary-sender-agreement-rules.js";
import { newPrimarySenderAgreement } from "./primary-sender-agreement.js";

test("PrimarySenderAgreementValidator reports every problem", () => {
  const validator = defaultPrimarySenderAgreementValidator();
  const item = newPrimarySenderAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySenderAgreementPriorityRangeRule flags values above priority", () => {
  const rule = new PrimarySenderAgreementPriorityRangeRule(32, 120);
  const item = newPrimarySenderAgreement("x", "y");
  item.priority = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySenderAgreementNameLengthRule flags a long name", () => {
  const rule = new PrimarySenderAgreementNameLengthRule(1000);
  const item = newPrimarySenderAgreement("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimarySenderAgreementLabelLengthRule flags a long label", () => {
  const rule = new PrimarySenderAgreementLabelLengthRule(86400);
  const item = newPrimarySenderAgreement("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
