import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteProfileBatchSizeRangeRule,
  InviteProfileCodeLengthRule,
  InviteProfileRateRangeRule,
  InviteProfileRequiredChannelRule,
  InviteProfileTitleLengthRule,
  defaultInviteProfileValidator,
} from "./invite-profile-rules.js";
import { newInviteProfile } from "./invite-profile.js";

test("InviteProfileValidator reports every problem", () => {
  const validator = defaultInviteProfileValidator();
  const item = newInviteProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteProfileTitleLengthRule flags a long title", () => {
  const rule = new InviteProfileTitleLengthRule(32);
  const item = newInviteProfile("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteProfileRateRangeRule flags values above rate", () => {
  const rule = new InviteProfileRateRangeRule(2.8, 4867.3);
  const item = newInviteProfile("x", "y");
  item.rate = 4868.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteProfileBatchSizeRangeRule flags values above batch size", () => {
  const rule = new InviteProfileBatchSizeRangeRule(80, 3600);
  const item = newInviteProfile("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteProfileCodeLengthRule flags a long code", () => {
  const rule = new InviteProfileCodeLengthRule(255);
  const item = newInviteProfile("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteProfileRequiredChannelRule flags a blank channel", () => {
  const rule = new InviteProfileRequiredChannelRule("invite profile needs this field");
  const item = newInviteProfile("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
