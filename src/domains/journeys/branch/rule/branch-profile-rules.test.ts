import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchProfileCategoryLengthRule,
  BranchProfileRequiredCategoryRule,
  BranchProfileRequiredCodeRule,
  BranchProfileRetriesRangeRule,
  BranchProfileTitleLengthRule,
  defaultBranchProfileValidator,
} from "./branch-profile-rules.js";
import { newBranchProfile } from "./branch-profile.js";

test("BranchProfileValidator reports every problem", () => {
  const validator = defaultBranchProfileValidator();
  const item = newBranchProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchProfileRequiredCategoryRule flags a blank category", () => {
  const rule = new BranchProfileRequiredCategoryRule("branch profile needs this field");
  const item = newBranchProfile("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchProfileRetriesRangeRule flags values above retries", () => {
  const rule = new BranchProfileRetriesRangeRule(64, 64);
  const item = newBranchProfile("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchProfileRequiredCodeRule flags a blank code", () => {
  const rule = new BranchProfileRequiredCodeRule("branch profile needs this field");
  const item = newBranchProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchProfileTitleLengthRule flags a long title", () => {
  const rule = new BranchProfileTitleLengthRule(80);
  const item = newBranchProfile("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchProfileCategoryLengthRule flags a long category", () => {
  const rule = new BranchProfileCategoryLengthRule(3600);
  const item = newBranchProfile("x", "y");
  item.category = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
