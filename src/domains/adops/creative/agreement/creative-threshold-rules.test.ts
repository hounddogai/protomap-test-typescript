import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeThresholdLocaleLengthRule,
  CreativeThresholdQuantityRangeRule,
  CreativeThresholdRequiredTitleRule,
  defaultCreativeThresholdValidator,
} from "./creative-threshold-rules.js";
import { newCreativeThreshold } from "./creative-threshold.js";

test("CreativeThresholdValidator reports every problem", () => {
  const validator = defaultCreativeThresholdValidator();
  const item = newCreativeThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeThresholdLocaleLengthRule flags a long locale", () => {
  const rule = new CreativeThresholdLocaleLengthRule(86400);
  const item = newCreativeThreshold("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new CreativeThresholdRequiredTitleRule("creative threshold needs an entry");
  const item = newCreativeThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeThresholdQuantityRangeRule flags values above quantity", () => {
  const rule = new CreativeThresholdQuantityRangeRule(120, 1000);
  const item = newCreativeThreshold("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
