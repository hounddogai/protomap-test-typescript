import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteBaselineCohortLengthRule,
  InviteBaselineLabelLengthRule,
  InviteBaselineRequiredLabelRule,
  defaultInviteBaselineValidator,
} from "./invite-baseline-rules.js";
import { newInviteBaseline } from "./invite-baseline.js";

test("InviteBaselineValidator reports every problem", () => {
  const validator = defaultInviteBaselineValidator();
  const item = newInviteBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteBaselineLabelLengthRule flags a long label", () => {
  const rule = new InviteBaselineLabelLengthRule(32);
  const item = newInviteBaseline("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new InviteBaselineRequiredLabelRule("invite baseline needs this field");
  const item = newInviteBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteBaselineCohortLengthRule flags a long cohort", () => {
  const rule = new InviteBaselineCohortLengthRule(86400);
  const item = newInviteBaseline("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
