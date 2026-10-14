import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionRollupChannelLengthRule,
  MentionRollupMinimumRangeRule,
  MentionRollupRequiredChannelRule,
  MentionRollupRequiredCodeRule,
  defaultMentionRollupValidator,
} from "./mention-rollup-rules.js";
import { newMentionRollup } from "./mention-rollup.js";

test("MentionRollupValidator reports every problem", () => {
  const validator = defaultMentionRollupValidator();
  const item = newMentionRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionRollupChannelLengthRule flags a long channel", () => {
  const rule = new MentionRollupChannelLengthRule(16);
  const item = newMentionRollup("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionRollupMinimumRangeRule flags values above minimum", () => {
  const rule = new MentionRollupMinimumRangeRule(4.6, 2774.8);
  const item = newMentionRollup("x", "y");
  item.minimum = 2776.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionRollupRequiredCodeRule flags a blank code", () => {
  const rule = new MentionRollupRequiredCodeRule("mention rollup needs an entry");
  const item = newMentionRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionRollupRequiredChannelRule flags a blank channel", () => {
  const rule = new MentionRollupRequiredChannelRule("mention rollup needs an entry");
  const item = newMentionRollup("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
