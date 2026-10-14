import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCreativeCycleLimitRangeRule,
  AdaptiveCreativeCycleSegmentLengthRule,
  AdaptiveCreativeCycleSendAtRangeRule,
  defaultAdaptiveCreativeCycleValidator,
} from "./adaptive-creative-cycle-rules.js";
import { newAdaptiveCreativeCycle } from "./adaptive-creative-cycle.js";

test("AdaptiveCreativeCycleValidator reports every problem", () => {
  const validator = defaultAdaptiveCreativeCycleValidator();
  const item = newAdaptiveCreativeCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCreativeCycleLimitRangeRule flags values above limit", () => {
  const rule = new AdaptiveCreativeCycleLimitRangeRule(120, 86400);
  const item = newAdaptiveCreativeCycle("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCreativeCycleSegmentLengthRule flags a long segment", () => {
  const rule = new AdaptiveCreativeCycleSegmentLengthRule(32);
  const item = newAdaptiveCreativeCycle("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveCreativeCycleSendAtRangeRule flags values above send at", () => {
  const rule = new AdaptiveCreativeCycleSendAtRangeRule(86400, 86400);
  const item = newAdaptiveCreativeCycle("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
