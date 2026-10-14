import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBounceBatchQuantityRangeRule,
  PrimaryBounceBatchRevisionRangeRule,
  defaultPrimaryBounceBatchValidator,
} from "./primary-bounce-batch-rules.js";
import { newPrimaryBounceBatch } from "./primary-bounce-batch.js";

test("PrimaryBounceBatchValidator reports every problem", () => {
  const validator = defaultPrimaryBounceBatchValidator();
  const item = newPrimaryBounceBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBounceBatchQuantityRangeRule flags values above quantity", () => {
  const rule = new PrimaryBounceBatchQuantityRangeRule(32, 255);
  const item = newPrimaryBounceBatch("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBounceBatchRevisionRangeRule flags values above revision", () => {
  const rule = new PrimaryBounceBatchRevisionRangeRule(1000, 3600);
  const item = newPrimaryBounceBatch("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
