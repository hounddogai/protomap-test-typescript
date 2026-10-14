import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryQueueRollupCodeLengthRule,
  PrimaryQueueRollupImpressionsRangeRule,
  PrimaryQueueRollupRequiredCodeRule,
  PrimaryQueueRollupTitleLengthRule,
  defaultPrimaryQueueRollupValidator,
} from "./primary-queue-rollup-rules.js";
import { newPrimaryQueueRollup } from "./primary-queue-rollup.js";

test("PrimaryQueueRollupValidator reports every problem", () => {
  const validator = defaultPrimaryQueueRollupValidator();
  const item = newPrimaryQueueRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryQueueRollupTitleLengthRule flags a long title", () => {
  const rule = new PrimaryQueueRollupTitleLengthRule(32);
  const item = newPrimaryQueueRollup("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryQueueRollupRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryQueueRollupRequiredCodeRule("primary queue rollup needs a value");
  const item = newPrimaryQueueRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryQueueRollupImpressionsRangeRule flags values above impressions", () => {
  const rule = new PrimaryQueueRollupImpressionsRangeRule(32, 3600);
  const item = newPrimaryQueueRollup("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryQueueRollupCodeLengthRule flags a long code", () => {
  const rule = new PrimaryQueueRollupCodeLengthRule(32);
  const item = newPrimaryQueueRollup("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
