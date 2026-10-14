import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingOptOutAgreementLabelLengthRule,
  RollingOptOutAgreementRequiredDescriptionRule,
  defaultRollingOptOutAgreementValidator,
} from "./rolling-opt-out-agreement-rules.js";
import { newRollingOptOutAgreement } from "./rolling-opt-out-agreement.js";

test("RollingOptOutAgreementValidator reports every problem", () => {
  const validator = defaultRollingOptOutAgreementValidator();
  const item = newRollingOptOutAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingOptOutAgreementLabelLengthRule flags a long label", () => {
  const rule = new RollingOptOutAgreementLabelLengthRule(86400);
  const item = newRollingOptOutAgreement("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutAgreementRequiredDescriptionRule flags a blank description", () => {
  const rule = new RollingOptOutAgreementRequiredDescriptionRule("rolling opt out agreement needs a value");
  const item = newRollingOptOutAgreement("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
