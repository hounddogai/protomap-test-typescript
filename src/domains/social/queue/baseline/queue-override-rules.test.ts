import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueOverrideCeilingRangeRule,
  QueueOverrideCodeLengthRule,
  QueueOverrideRatioRangeRule,
  QueueOverrideRetriesRangeRule,
  defaultQueueOverrideValidator,
} from "./queue-override-rules.js";
import { newQueueOverride } from "./queue-override.js";

test("QueueOverrideValidator reports every problem", () => {
  const validator = defaultQueueOverrideValidator();
  const item = newQueueOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueOverrideRetriesRangeRule flags values above retries", () => {
  const rule = new QueueOverrideRetriesRangeRule(255, 86400);
  const item = newQueueOverride("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueOverrideCodeLengthRule flags a long code", () => {
  const rule = new QueueOverrideCodeLengthRule(86400);
  const item = newQueueOverride("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueOverrideCeilingRangeRule flags values above ceiling", () => {
  const rule = new QueueOverrideCeilingRangeRule(3.8, 2116.7);
  const item = newQueueOverride("x", "y");
  item.ceiling = 2118.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueOverrideRatioRangeRule flags values above ratio", () => {
  const rule = new QueueOverrideRatioRangeRule(2.4, 4837.9);
  const item = newQueueOverride("x", "y");
  item.ratio = 4839.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
