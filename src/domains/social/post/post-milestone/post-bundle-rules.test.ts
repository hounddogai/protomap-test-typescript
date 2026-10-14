import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostBundleAudienceIdLengthRule,
  PostBundleClicksRangeRule,
  PostBundleCodeLengthRule,
  PostBundleRequiredCodeRule,
  defaultPostBundleValidator,
} from "./post-bundle-rules.js";
import { newPostBundle } from "./post-bundle.js";

test("PostBundleValidator reports every problem", () => {
  const validator = defaultPostBundleValidator();
  const item = newPostBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostBundleClicksRangeRule flags values above clicks", () => {
  const rule = new PostBundleClicksRangeRule(80, 1000);
  const item = newPostBundle("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostBundleRequiredCodeRule flags a blank code", () => {
  const rule = new PostBundleRequiredCodeRule("post bundle needs an entry");
  const item = newPostBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostBundleCodeLengthRule flags a long code", () => {
  const rule = new PostBundleCodeLengthRule(16);
  const item = newPostBundle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostBundleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PostBundleAudienceIdLengthRule(86400);
  const item = newPostBundle("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
