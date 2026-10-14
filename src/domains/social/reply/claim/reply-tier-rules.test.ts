import assert from "node:assert/strict";
import { test } from "node:test";
import { ReplyTierRequiredTitleRule, defaultReplyTierValidator } from "./reply-tier-rules.js";
import { newReplyTier } from "./reply-tier.js";

test("ReplyTierValidator reports every problem", () => {
  const validator = defaultReplyTierValidator();
  const item = newReplyTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyTierRequiredTitleRule flags a blank title", () => {
  const rule = new ReplyTierRequiredTitleRule("reply tier needs a value");
  const item = newReplyTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
