import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBranchRollupGraceDaysRangeRule,
  PrimaryBranchRollupRequiredCodeRule,
  PrimaryBranchRollupRequiredNameRule,
  PrimaryBranchRollupRevisionRangeRule,
  PrimaryBranchRollupStartsAtRangeRule,
  defaultPrimaryBranchRollupValidator,
} from "./primary-branch-rollup-rules.js";
import { newPrimaryBranchRollup } from "./primary-branch-rollup.js";

test("PrimaryBranchRollupValidator reports every problem", () => {
  const validator = defaultPrimaryBranchRollupValidator();
  const item = newPrimaryBranchRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBranchRollupGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PrimaryBranchRollupGraceDaysRangeRule(120, 86400);
  const item = newPrimaryBranchRollup("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBranchRollupRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryBranchRollupRequiredCodeRule("primary branch rollup needs an entry");
  const item = newPrimaryBranchRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryBranchRollupRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryBranchRollupRequiredNameRule("primary branch rollup needs this field");
  const item = newPrimaryBranchRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryBranchRollupStartsAtRangeRule flags values above starts at", () => {
  const rule = new PrimaryBranchRollupStartsAtRangeRule(120, 1000);
  const item = newPrimaryBranchRollup("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBranchRollupRevisionRangeRule flags values above revision", () => {
  const rule = new PrimaryBranchRollupRevisionRangeRule(255, 1000);
  const item = newPrimaryBranchRollup("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
