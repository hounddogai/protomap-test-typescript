import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRewardRuleCheckpointAmountRangeRule,
  LenientRewardRuleCheckpointMaximumRangeRule,
  LenientRewardRuleCheckpointRequiredCodeRule,
  LenientRewardRuleCheckpointTitleLengthRule,
  defaultLenientRewardRuleCheckpointValidator,
} from "./lenient-reward-rule-checkpoint-rules.js";
import { newLenientRewardRuleCheckpoint } from "./lenient-reward-rule-checkpoint.js";

test("LenientRewardRuleCheckpointValidator reports every problem", () => {
  const validator = defaultLenientRewardRuleCheckpointValidator();
  const item = newLenientRewardRuleCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRewardRuleCheckpointTitleLengthRule flags a long title", () => {
  const rule = new LenientRewardRuleCheckpointTitleLengthRule(255);
  const item = newLenientRewardRuleCheckpoint("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardRuleCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new LenientRewardRuleCheckpointRequiredCodeRule("lenient reward rule checkpoint needs this field");
  const item = newLenientRewardRuleCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientRewardRuleCheckpointMaximumRangeRule flags values above maximum", () => {
  const rule = new LenientRewardRuleCheckpointMaximumRangeRule(5.8, 1934.9);
  const item = newLenientRewardRuleCheckpoint("x", "y");
  item.maximum = 1936.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRewardRuleCheckpointAmountRangeRule flags values above amount", () => {
  const rule = new LenientRewardRuleCheckpointAmountRangeRule(8.9, 757.6);
  const item = newLenientRewardRuleCheckpoint("x", "y");
  item.amount = 759.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
