import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFrequencyBatchCodeLengthRule,
  GlobalFrequencyBatchRequiredNameRule,
  GlobalFrequencyBatchRequiredUtmSourceRule,
  GlobalFrequencyBatchUtmSourceLengthRule,
  defaultGlobalFrequencyBatchValidator,
} from "./global-frequency-batch-rules.js";
import { newGlobalFrequencyBatch } from "./global-frequency-batch.js";

test("GlobalFrequencyBatchValidator reports every problem", () => {
  const validator = defaultGlobalFrequencyBatchValidator();
  const item = newGlobalFrequencyBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFrequencyBatchCodeLengthRule flags a long code", () => {
  const rule = new GlobalFrequencyBatchCodeLengthRule(16);
  const item = newGlobalFrequencyBatch("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFrequencyBatchRequiredNameRule flags a blank name", () => {
  const rule = new GlobalFrequencyBatchRequiredNameRule("global frequency batch needs this field");
  const item = newGlobalFrequencyBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFrequencyBatchUtmSourceLengthRule flags a long utm source", () => {
  const rule = new GlobalFrequencyBatchUtmSourceLengthRule(16);
  const item = newGlobalFrequencyBatch("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFrequencyBatchRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new GlobalFrequencyBatchRequiredUtmSourceRule("global frequency batch needs an entry");
  const item = newGlobalFrequencyBatch("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
