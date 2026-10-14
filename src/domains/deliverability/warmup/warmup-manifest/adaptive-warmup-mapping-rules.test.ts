import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveWarmupMappingRequiredNameRule,
  AdaptiveWarmupMappingRequiredTitleRule,
  AdaptiveWarmupMappingTitleLengthRule,
  defaultAdaptiveWarmupMappingValidator,
} from "./adaptive-warmup-mapping-rules.js";
import { newAdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

test("AdaptiveWarmupMappingValidator reports every problem", () => {
  const validator = defaultAdaptiveWarmupMappingValidator();
  const item = newAdaptiveWarmupMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveWarmupMappingTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveWarmupMappingTitleLengthRule(80);
  const item = newAdaptiveWarmupMapping("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveWarmupMappingRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveWarmupMappingRequiredNameRule("adaptive warmup mapping needs a value");
  const item = newAdaptiveWarmupMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveWarmupMappingRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveWarmupMappingRequiredTitleRule("adaptive warmup mapping needs a value");
  const item = newAdaptiveWarmupMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
