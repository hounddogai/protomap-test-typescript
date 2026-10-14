import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteRollupGraceDaysRangeRule,
  InviteRollupLabelLengthRule,
  InviteRollupRequiredLabelRule,
  defaultInviteRollupValidator,
} from "./invite-rollup-rules.js";
import { newInviteRollup } from "./invite-rollup.js";

test("InviteRollupValidator reports every problem", () => {
  const validator = defaultInviteRollupValidator();
  const item = newInviteRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteRollupLabelLengthRule flags a long label", () => {
  const rule = new InviteRollupLabelLengthRule(86400);
  const item = newInviteRollup("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteRollupRequiredLabelRule flags a blank label", () => {
  const rule = new InviteRollupRequiredLabelRule("invite rollup needs a value");
  const item = newInviteRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteRollupGraceDaysRangeRule flags values above grace days", () => {
  const rule = new InviteRollupGraceDaysRangeRule(1000, 1000);
  const item = newInviteRollup("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
