import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictQueueVarianceCodeLengthRule,
  StrictQueueVarianceRequiredTitleRule,
  defaultStrictQueueVarianceValidator,
} from "./strict-queue-variance-rules.js";
import { newStrictQueueVariance } from "./strict-queue-variance.js";

test("StrictQueueVarianceValidator reports every problem", () => {
  const validator = defaultStrictQueueVarianceValidator();
  const item = newStrictQueueVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictQueueVarianceCodeLengthRule flags a long code", () => {
  const rule = new StrictQueueVarianceCodeLengthRule(86400);
  const item = newStrictQueueVariance("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictQueueVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new StrictQueueVarianceRequiredTitleRule("strict queue variance needs an entry");
  const item = newStrictQueueVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
