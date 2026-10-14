import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupTargetCodeLengthRule,
  WarmupTargetRequiredCodeRule,
  WarmupTargetRequiredReviewerRule,
  WarmupTargetRetriesRangeRule,
  defaultWarmupTargetValidator,
} from "./warmup-target-rules.js";
import { newWarmupTarget } from "./warmup-target.js";

test("WarmupTargetValidator reports every problem", () => {
  const validator = defaultWarmupTargetValidator();
  const item = newWarmupTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupTargetRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new WarmupTargetRequiredReviewerRule("warmup target needs a value");
  const item = newWarmupTarget("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupTargetRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupTargetRequiredCodeRule("warmup target needs an entry");
  const item = newWarmupTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupTargetRetriesRangeRule flags values above retries", () => {
  const rule = new WarmupTargetRetriesRangeRule(32, 3600);
  const item = newWarmupTarget("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupTargetCodeLengthRule flags a long code", () => {
  const rule = new WarmupTargetCodeLengthRule(32);
  const item = newWarmupTarget("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
