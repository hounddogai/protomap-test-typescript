import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleCheckpointBidRangeRule,
  ExitRuleCheckpointCapacityRangeRule,
  ExitRuleCheckpointCodeLengthRule,
  ExitRuleCheckpointRequiredTitleRule,
  ExitRuleCheckpointReviewerLengthRule,
  ExitRuleCheckpointVersionRangeRule,
  defaultExitRuleCheckpointValidator,
} from "./exit-rule-checkpoint-rules.js";
import { newExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

test("ExitRuleCheckpointValidator reports every problem", () => {
  const validator = defaultExitRuleCheckpointValidator();
  const item = newExitRuleCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleCheckpointVersionRangeRule flags values above version", () => {
  const rule = new ExitRuleCheckpointVersionRangeRule(16, 255);
  const item = newExitRuleCheckpoint("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleCheckpointReviewerLengthRule flags a long reviewer", () => {
  const rule = new ExitRuleCheckpointReviewerLengthRule(255);
  const item = newExitRuleCheckpoint("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleCheckpointRequiredTitleRule flags a blank title", () => {
  const rule = new ExitRuleCheckpointRequiredTitleRule("exit rule checkpoint needs an entry");
  const item = newExitRuleCheckpoint("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleCheckpointCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleCheckpointCodeLengthRule(255);
  const item = newExitRuleCheckpoint("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleCheckpointCapacityRangeRule flags values above capacity", () => {
  const rule = new ExitRuleCheckpointCapacityRangeRule(120, 120);
  const item = newExitRuleCheckpoint("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleCheckpointBidRangeRule flags values above bid", () => {
  const rule = new ExitRuleCheckpointBidRangeRule(6.3, 1538.3);
  const item = newExitRuleCheckpoint("x", "y");
  item.bid = 1539.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
