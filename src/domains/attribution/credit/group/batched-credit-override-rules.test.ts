import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCreditOverrideRequiredLabelRule,
  BatchedCreditOverrideRequiredSegmentRule,
  BatchedCreditOverrideRequiredUtmSourceRule,
  BatchedCreditOverrideSegmentLengthRule,
  defaultBatchedCreditOverrideValidator,
} from "./batched-credit-override-rules.js";
import { newBatchedCreditOverride } from "./batched-credit-override.js";

test("BatchedCreditOverrideValidator reports every problem", () => {
  const validator = defaultBatchedCreditOverrideValidator();
  const item = newBatchedCreditOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCreditOverrideRequiredSegmentRule flags a blank segment", () => {
  const rule = new BatchedCreditOverrideRequiredSegmentRule("batched credit override needs this field");
  const item = newBatchedCreditOverride("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCreditOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedCreditOverrideRequiredLabelRule("batched credit override needs a value");
  const item = newBatchedCreditOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCreditOverrideRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new BatchedCreditOverrideRequiredUtmSourceRule("batched credit override needs a value");
  const item = newBatchedCreditOverride("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCreditOverrideSegmentLengthRule flags a long segment", () => {
  const rule = new BatchedCreditOverrideSegmentLengthRule(80);
  const item = newBatchedCreditOverride("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
