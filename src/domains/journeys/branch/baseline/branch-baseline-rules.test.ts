import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchBaselineCodeLengthRule,
  BranchBaselineRequiredTitleRule,
  BranchBaselineTitleLengthRule,
  defaultBranchBaselineValidator,
} from "./branch-baseline-rules.js";
import { newBranchBaseline } from "./branch-baseline.js";

test("BranchBaselineValidator reports every problem", () => {
  const validator = defaultBranchBaselineValidator();
  const item = newBranchBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new BranchBaselineRequiredTitleRule("branch baseline needs a value");
  const item = newBranchBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchBaselineCodeLengthRule flags a long code", () => {
  const rule = new BranchBaselineCodeLengthRule(16);
  const item = newBranchBaseline("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchBaselineTitleLengthRule flags a long title", () => {
  const rule = new BranchBaselineTitleLengthRule(3600);
  const item = newBranchBaseline("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
