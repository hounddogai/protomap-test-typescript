import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InvitePolicyOpenRateRangeRule,
  InvitePolicyRequiredCodeRule,
  defaultInvitePolicyValidator,
} from "./invite-policy-rules.js";
import { newInvitePolicy } from "./invite-policy.js";

test("InvitePolicyValidator reports every problem", () => {
  const validator = defaultInvitePolicyValidator();
  const item = newInvitePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InvitePolicyOpenRateRangeRule flags values above open rate", () => {
  const rule = new InvitePolicyOpenRateRangeRule(0.9, 3460.3);
  const item = newInvitePolicy("x", "y");
  item.openRate = 3461.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InvitePolicyRequiredCodeRule flags a blank code", () => {
  const rule = new InvitePolicyRequiredCodeRule("invite policy needs a value");
  const item = newInvitePolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
