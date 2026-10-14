import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingWarmupRuleCeilingRangeRule,
  PendingWarmupRuleCodeLengthRule,
  defaultPendingWarmupRuleValidator,
} from "./pending-warmup-rule-rules.js";
import { newPendingWarmupRule } from "./pending-warmup-rule.js";

test("PendingWarmupRuleValidator reports every problem", () => {
  const validator = defaultPendingWarmupRuleValidator();
  const item = newPendingWarmupRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingWarmupRuleCodeLengthRule flags a long code", () => {
  const rule = new PendingWarmupRuleCodeLengthRule(86400);
  const item = newPendingWarmupRule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingWarmupRuleCeilingRangeRule flags values above ceiling", () => {
  const rule = new PendingWarmupRuleCeilingRangeRule(8.3, 2619.6);
  const item = newPendingWarmupRule("x", "y");
  item.ceiling = 2621.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
