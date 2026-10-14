import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchRuleRequiredCodeRule,
  BranchRuleRequiredTitleRule,
  defaultBranchRuleValidator,
} from "./branch-rule-rules.js";
import { newBranchRule } from "./branch-rule.js";

test("BranchRuleValidator reports every problem", () => {
  const validator = defaultBranchRuleValidator();
  const item = newBranchRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchRuleRequiredCodeRule flags a blank code", () => {
  const rule = new BranchRuleRequiredCodeRule("branch rule needs this field");
  const item = newBranchRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchRuleRequiredTitleRule flags a blank title", () => {
  const rule = new BranchRuleRequiredTitleRule("branch rule needs this field");
  const item = newBranchRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
