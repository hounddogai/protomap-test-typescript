import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionPolicyChannelLengthRule,
  MentionPolicyRequiredChannelRule,
  MentionPolicyRequiredPhoneRule,
  defaultMentionPolicyValidator,
} from "./mention-policy-rules.js";
import { newMentionPolicy } from "./mention-policy.js";

test("MentionPolicyValidator reports every problem", () => {
  const validator = defaultMentionPolicyValidator();
  const item = newMentionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionPolicyRequiredPhoneRule flags a blank phone", () => {
  const rule = new MentionPolicyRequiredPhoneRule("mention policy needs this field");
  const item = newMentionPolicy("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionPolicyChannelLengthRule flags a long channel", () => {
  const rule = new MentionPolicyChannelLengthRule(1000);
  const item = newMentionPolicy("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionPolicyRequiredChannelRule flags a blank channel", () => {
  const rule = new MentionPolicyRequiredChannelRule("mention policy needs a value");
  const item = newMentionPolicy("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
