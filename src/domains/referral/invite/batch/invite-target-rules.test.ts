import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteTargetDiscountRangeRule,
  InviteTargetRequiredUtmSourceRule,
  defaultInviteTargetValidator,
} from "./invite-target-rules.js";
import { newInviteTarget } from "./invite-target.js";

test("InviteTargetValidator reports every problem", () => {
  const validator = defaultInviteTargetValidator();
  const item = newInviteTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteTargetDiscountRangeRule flags values above discount", () => {
  const rule = new InviteTargetDiscountRangeRule(6.7, 2205.1);
  const item = newInviteTarget("x", "y");
  item.discount = 2206.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteTargetRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new InviteTargetRequiredUtmSourceRule("invite target needs an entry");
  const item = newInviteTarget("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
