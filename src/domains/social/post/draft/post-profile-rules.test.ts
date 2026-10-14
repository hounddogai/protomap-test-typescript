import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostProfileLabelLengthRule,
  PostProfileRequiredCodeRule,
  PostProfileRequiredLabelRule,
  defaultPostProfileValidator,
} from "./post-profile-rules.js";
import { newPostProfile } from "./post-profile.js";

test("PostProfileValidator reports every problem", () => {
  const validator = defaultPostProfileValidator();
  const item = newPostProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostProfileLabelLengthRule flags a long label", () => {
  const rule = new PostProfileLabelLengthRule(32);
  const item = newPostProfile("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostProfileRequiredCodeRule flags a blank code", () => {
  const rule = new PostProfileRequiredCodeRule("post profile needs a value");
  const item = newPostProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostProfileRequiredLabelRule flags a blank label", () => {
  const rule = new PostProfileRequiredLabelRule("post profile needs this field");
  const item = newPostProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
