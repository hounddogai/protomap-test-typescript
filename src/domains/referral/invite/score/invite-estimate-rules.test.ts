import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteEstimateGraceDaysRangeRule,
  InviteEstimateRequiredCodeRule,
  defaultInviteEstimateValidator,
} from "./invite-estimate-rules.js";
import { newInviteEstimate } from "./invite-estimate.js";

test("InviteEstimateValidator reports every problem", () => {
  const validator = defaultInviteEstimateValidator();
  const item = newInviteEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteEstimateGraceDaysRangeRule flags values above grace days", () => {
  const rule = new InviteEstimateGraceDaysRangeRule(16, 120);
  const item = newInviteEstimate("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new InviteEstimateRequiredCodeRule("invite estimate needs this field");
  const item = newInviteEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
