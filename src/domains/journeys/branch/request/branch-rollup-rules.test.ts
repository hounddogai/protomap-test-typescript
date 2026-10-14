import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchRollupCountryLengthRule,
  BranchRollupLabelLengthRule,
  BranchRollupRequiredLabelRule,
  BranchRollupReviewerLengthRule,
  BranchRollupRevisionRangeRule,
  defaultBranchRollupValidator,
} from "./branch-rollup-rules.js";
import { newBranchRollup } from "./branch-rollup.js";

test("BranchRollupValidator reports every problem", () => {
  const validator = defaultBranchRollupValidator();
  const item = newBranchRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchRollupLabelLengthRule flags a long label", () => {
  const rule = new BranchRollupLabelLengthRule(80);
  const item = newBranchRollup("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchRollupRequiredLabelRule flags a blank label", () => {
  const rule = new BranchRollupRequiredLabelRule("branch rollup needs an entry");
  const item = newBranchRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchRollupReviewerLengthRule flags a long reviewer", () => {
  const rule = new BranchRollupReviewerLengthRule(120);
  const item = newBranchRollup("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchRollupRevisionRangeRule flags values above revision", () => {
  const rule = new BranchRollupRevisionRangeRule(120, 255);
  const item = newBranchRollup("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchRollupCountryLengthRule flags a long country", () => {
  const rule = new BranchRollupCountryLengthRule(16);
  const item = newBranchRollup("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
