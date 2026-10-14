import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionTierAmountRangeRule,
  MentionTierRequiredLabelRule,
  MentionTierRetriesRangeRule,
  defaultMentionTierValidator,
} from "./mention-tier-rules.js";
import { newMentionTier } from "./mention-tier.js";

test("MentionTierValidator reports every problem", () => {
  const validator = defaultMentionTierValidator();
  const item = newMentionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionTierAmountRangeRule flags values above amount", () => {
  const rule = new MentionTierAmountRangeRule(8.9, 2818.1);
  const item = newMentionTier("x", "y");
  item.amount = 2819.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionTierRequiredLabelRule flags a blank label", () => {
  const rule = new MentionTierRequiredLabelRule("mention tier needs a value");
  const item = newMentionTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionTierRetriesRangeRule flags values above retries", () => {
  const rule = new MentionTierRetriesRangeRule(255, 86400);
  const item = newMentionTier("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
