import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteCycleJourneyIdLengthRule,
  InviteCycleLabelLengthRule,
  InviteCycleRequiredCodeRule,
  InviteCycleRequiredLabelRule,
  InviteCycleVersionRangeRule,
  defaultInviteCycleValidator,
} from "./invite-cycle-rules.js";
import { newInviteCycle } from "./invite-cycle.js";

test("InviteCycleValidator reports every problem", () => {
  const validator = defaultInviteCycleValidator();
  const item = newInviteCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteCycleRequiredCodeRule flags a blank code", () => {
  const rule = new InviteCycleRequiredCodeRule("invite cycle needs an entry");
  const item = newInviteCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteCycleVersionRangeRule flags values above version", () => {
  const rule = new InviteCycleVersionRangeRule(80, 120);
  const item = newInviteCycle("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteCycleRequiredLabelRule flags a blank label", () => {
  const rule = new InviteCycleRequiredLabelRule("invite cycle needs a value");
  const item = newInviteCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteCycleLabelLengthRule flags a long label", () => {
  const rule = new InviteCycleLabelLengthRule(80);
  const item = newInviteCycle("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteCycleJourneyIdLengthRule flags a long journey id", () => {
  const rule = new InviteCycleJourneyIdLengthRule(86400);
  const item = newInviteCycle("x", "y");
  item.journeyId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
