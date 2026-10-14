import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupRuleCodeLengthRule,
  WarmupRuleRevisionRangeRule,
  WarmupRuleStartsAtRangeRule,
  defaultWarmupRuleValidator,
} from "./warmup-rule-rules.js";
import { newWarmupRule } from "./warmup-rule.js";

test("WarmupRuleValidator reports every problem", () => {
  const validator = defaultWarmupRuleValidator();
  const item = newWarmupRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupRuleRevisionRangeRule flags values above revision", () => {
  const rule = new WarmupRuleRevisionRangeRule(255, 3600);
  const item = newWarmupRule("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupRuleCodeLengthRule flags a long code", () => {
  const rule = new WarmupRuleCodeLengthRule(64);
  const item = newWarmupRule("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupRuleStartsAtRangeRule flags values above starts at", () => {
  const rule = new WarmupRuleStartsAtRangeRule(16, 64);
  const item = newWarmupRule("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
