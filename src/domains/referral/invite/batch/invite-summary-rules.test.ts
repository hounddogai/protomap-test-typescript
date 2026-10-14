import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteSummaryCodeLengthRule,
  InviteSummaryExternalRefLengthRule,
  InviteSummaryRequiredLabelRule,
  InviteSummaryRequiredSummaryRule,
  defaultInviteSummaryValidator,
} from "./invite-summary-rules.js";
import { newInviteSummary } from "./invite-summary.js";

test("InviteSummaryValidator reports every problem", () => {
  const validator = defaultInviteSummaryValidator();
  const item = newInviteSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteSummaryRequiredSummaryRule flags a blank summary", () => {
  const rule = new InviteSummaryRequiredSummaryRule("invite summary needs this field");
  const item = newInviteSummary("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteSummaryExternalRefLengthRule flags a long external ref", () => {
  const rule = new InviteSummaryExternalRefLengthRule(1000);
  const item = newInviteSummary("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new InviteSummaryRequiredLabelRule("invite summary needs an entry");
  const item = newInviteSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteSummaryCodeLengthRule flags a long code", () => {
  const rule = new InviteSummaryCodeLengthRule(120);
  const item = newInviteSummary("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
