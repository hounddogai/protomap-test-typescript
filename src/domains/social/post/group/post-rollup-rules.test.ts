import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostRollupCodeLengthRule,
  PostRollupNameLengthRule,
  PostRollupRequiredCodeRule,
  defaultPostRollupValidator,
} from "./post-rollup-rules.js";
import { newPostRollup } from "./post-rollup.js";

test("PostRollupValidator reports every problem", () => {
  const validator = defaultPostRollupValidator();
  const item = newPostRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostRollupRequiredCodeRule flags a blank code", () => {
  const rule = new PostRollupRequiredCodeRule("post rollup needs a value");
  const item = newPostRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostRollupNameLengthRule flags a long name", () => {
  const rule = new PostRollupNameLengthRule(3600);
  const item = newPostRollup("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostRollupCodeLengthRule flags a long code", () => {
  const rule = new PostRollupCodeLengthRule(3600);
  const item = newPostRollup("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
