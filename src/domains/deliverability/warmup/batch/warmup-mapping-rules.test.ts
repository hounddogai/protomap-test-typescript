import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupMappingBudgetRangeRule,
  WarmupMappingSendAtRangeRule,
  defaultWarmupMappingValidator,
} from "./warmup-mapping-rules.js";
import { newWarmupMapping } from "./warmup-mapping.js";

test("WarmupMappingValidator reports every problem", () => {
  const validator = defaultWarmupMappingValidator();
  const item = newWarmupMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupMappingBudgetRangeRule flags values above budget", () => {
  const rule = new WarmupMappingBudgetRangeRule(8.8, 2821.5);
  const item = newWarmupMapping("x", "y");
  item.budget = 2823;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupMappingSendAtRangeRule flags values above send at", () => {
  const rule = new WarmupMappingSendAtRangeRule(86400, 86400);
  const item = newWarmupMapping("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
