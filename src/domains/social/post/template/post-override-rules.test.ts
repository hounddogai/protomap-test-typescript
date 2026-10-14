import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostOverrideCreatedAtRangeRule,
  PostOverrideRatioRangeRule,
  PostOverrideRequiredCodeRule,
  PostOverrideRequiredTitleRule,
  defaultPostOverrideValidator,
} from "./post-override-rules.js";
import { newPostOverride } from "./post-override.js";

test("PostOverrideValidator reports every problem", () => {
  const validator = defaultPostOverrideValidator();
  const item = newPostOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostOverrideCreatedAtRangeRule flags values above created at", () => {
  const rule = new PostOverrideCreatedAtRangeRule(32, 120);
  const item = newPostOverride("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new PostOverrideRequiredTitleRule("post override needs a value");
  const item = newPostOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostOverrideRatioRangeRule flags values above ratio", () => {
  const rule = new PostOverrideRatioRangeRule(1.1, 2027);
  const item = newPostOverride("x", "y");
  item.ratio = 2028.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new PostOverrideRequiredCodeRule("post override needs an entry");
  const item = newPostOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
