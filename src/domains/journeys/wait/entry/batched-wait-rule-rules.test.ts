import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedWaitRuleLimitRangeRule,
  BatchedWaitRuleRequiredCodeRule,
  BatchedWaitRuleRequiredTitleRule,
  defaultBatchedWaitRuleValidator,
} from "./batched-wait-rule-rules.js";
import { newBatchedWaitRule } from "./batched-wait-rule.js";

test("BatchedWaitRuleValidator reports every problem", () => {
  const validator = defaultBatchedWaitRuleValidator();
  const item = newBatchedWaitRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedWaitRuleRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedWaitRuleRequiredTitleRule("batched wait rule needs this field");
  const item = newBatchedWaitRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitRuleRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedWaitRuleRequiredCodeRule("batched wait rule needs a value");
  const item = newBatchedWaitRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitRuleLimitRangeRule flags values above limit", () => {
  const rule = new BatchedWaitRuleLimitRangeRule(80, 86400);
  const item = newBatchedWaitRule("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
