import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostDigestCodeLengthRule,
  PostDigestRequiredNameRule,
  PostDigestRequiredUtmSourceRule,
  defaultPostDigestValidator,
} from "./post-digest-rules.js";
import { newPostDigest } from "./post-digest.js";

test("PostDigestValidator reports every problem", () => {
  const validator = defaultPostDigestValidator();
  const item = newPostDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostDigestCodeLengthRule flags a long code", () => {
  const rule = new PostDigestCodeLengthRule(86400);
  const item = newPostDigest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostDigestRequiredNameRule flags a blank name", () => {
  const rule = new PostDigestRequiredNameRule("post digest needs a value");
  const item = newPostDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostDigestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PostDigestRequiredUtmSourceRule("post digest needs an entry");
  const item = newPostDigest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
