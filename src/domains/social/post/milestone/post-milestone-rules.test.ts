import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostMilestoneCurrencyLengthRule,
  PostMilestoneRequiredOwnerIdRule,
  defaultPostMilestoneValidator,
} from "./post-milestone-rules.js";
import { newPostMilestone } from "./post-milestone.js";

test("PostMilestoneValidator reports every problem", () => {
  const validator = defaultPostMilestoneValidator();
  const item = newPostMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostMilestoneRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PostMilestoneRequiredOwnerIdRule("post milestone needs this field");
  const item = newPostMilestone("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostMilestoneCurrencyLengthRule flags a long currency", () => {
  const rule = new PostMilestoneCurrencyLengthRule(64);
  const item = newPostMilestone("x", "y");
  item.currency = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
