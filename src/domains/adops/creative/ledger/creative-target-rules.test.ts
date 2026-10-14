import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeTargetContactEmailLengthRule,
  CreativeTargetRequiredSourceRule,
  CreativeTargetThresholdRangeRule,
  CreativeTargetUpdatedAtRangeRule,
  defaultCreativeTargetValidator,
} from "./creative-target-rules.js";
import { newCreativeTarget } from "./creative-target.js";

test("CreativeTargetValidator reports every problem", () => {
  const validator = defaultCreativeTargetValidator();
  const item = newCreativeTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeTargetThresholdRangeRule flags values above threshold", () => {
  const rule = new CreativeTargetThresholdRangeRule(7.5, 4301.9);
  const item = newCreativeTarget("x", "y");
  item.threshold = 4303.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeTargetUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CreativeTargetUpdatedAtRangeRule(64, 80);
  const item = newCreativeTarget("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeTargetRequiredSourceRule flags a blank source", () => {
  const rule = new CreativeTargetRequiredSourceRule("creative target needs an entry");
  const item = newCreativeTarget("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeTargetContactEmailLengthRule flags a long contact email", () => {
  const rule = new CreativeTargetContactEmailLengthRule(32);
  const item = newCreativeTarget("x", "y");
  item.contactEmail = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
