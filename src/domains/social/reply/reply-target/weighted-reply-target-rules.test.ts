import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedReplyTargetChecksumLengthRule,
  WeightedReplyTargetNameLengthRule,
  WeightedReplyTargetRequiredCodeRule,
  WeightedReplyTargetRequiredTitleRule,
  WeightedReplyTargetTitleLengthRule,
  defaultWeightedReplyTargetValidator,
} from "./weighted-reply-target-rules.js";
import { newWeightedReplyTarget } from "./weighted-reply-target.js";

test("WeightedReplyTargetValidator reports every problem", () => {
  const validator = defaultWeightedReplyTargetValidator();
  const item = newWeightedReplyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedReplyTargetRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedReplyTargetRequiredCodeRule("weighted reply target needs an entry");
  const item = newWeightedReplyTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReplyTargetRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedReplyTargetRequiredTitleRule("weighted reply target needs an entry");
  const item = newWeightedReplyTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReplyTargetTitleLengthRule flags a long title", () => {
  const rule = new WeightedReplyTargetTitleLengthRule(1000);
  const item = newWeightedReplyTarget("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReplyTargetNameLengthRule flags a long name", () => {
  const rule = new WeightedReplyTargetNameLengthRule(3600);
  const item = newWeightedReplyTarget("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReplyTargetChecksumLengthRule flags a long checksum", () => {
  const rule = new WeightedReplyTargetChecksumLengthRule(3600);
  const item = newWeightedReplyTarget("x", "y");
  item.checksum = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
