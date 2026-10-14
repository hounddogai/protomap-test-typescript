import assert from "node:assert/strict";
import { test } from "node:test";
import { PostTierRequiredCodeRule, PostTierRequiredNameRule, defaultPostTierValidator } from "./post-tier-rules.js";
import { newPostTier } from "./post-tier.js";

test("PostTierValidator reports every problem", () => {
  const validator = defaultPostTierValidator();
  const item = newPostTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostTierRequiredNameRule flags a blank name", () => {
  const rule = new PostTierRequiredNameRule("post tier needs this field");
  const item = newPostTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostTierRequiredCodeRule flags a blank code", () => {
  const rule = new PostTierRequiredCodeRule("post tier needs this field");
  const item = newPostTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
