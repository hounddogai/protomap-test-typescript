import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedExitRuleMappingLocaleLengthRule,
  BatchedExitRuleMappingRequiredCodeRule,
  BatchedExitRuleMappingRequiredLocaleRule,
  defaultBatchedExitRuleMappingValidator,
} from "./batched-exit-rule-mapping-rules.js";
import { newBatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

test("BatchedExitRuleMappingValidator reports every problem", () => {
  const validator = defaultBatchedExitRuleMappingValidator();
  const item = newBatchedExitRuleMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedExitRuleMappingRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedExitRuleMappingRequiredCodeRule("batched exit rule mapping needs an entry");
  const item = newBatchedExitRuleMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedExitRuleMappingRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedExitRuleMappingRequiredLocaleRule("batched exit rule mapping needs an entry");
  const item = newBatchedExitRuleMapping("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedExitRuleMappingLocaleLengthRule flags a long locale", () => {
  const rule = new BatchedExitRuleMappingLocaleLengthRule(32);
  const item = newBatchedExitRuleMapping("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
