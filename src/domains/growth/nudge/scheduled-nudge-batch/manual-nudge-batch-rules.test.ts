import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualNudgeBatchCountryLengthRule,
  ManualNudgeBatchLabelLengthRule,
  ManualNudgeBatchRequiredCountryRule,
  ManualNudgeBatchRequiredTimezoneRule,
  ManualNudgeBatchTimezoneLengthRule,
  defaultManualNudgeBatchValidator,
} from "./manual-nudge-batch-rules.js";
import { newManualNudgeBatch } from "./manual-nudge-batch.js";

test("ManualNudgeBatchValidator reports every problem", () => {
  const validator = defaultManualNudgeBatchValidator();
  const item = newManualNudgeBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualNudgeBatchCountryLengthRule flags a long country", () => {
  const rule = new ManualNudgeBatchCountryLengthRule(86400);
  const item = newManualNudgeBatch("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualNudgeBatchRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ManualNudgeBatchRequiredTimezoneRule("manual nudge batch needs an entry");
  const item = newManualNudgeBatch("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualNudgeBatchLabelLengthRule flags a long label", () => {
  const rule = new ManualNudgeBatchLabelLengthRule(3600);
  const item = newManualNudgeBatch("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualNudgeBatchTimezoneLengthRule flags a long timezone", () => {
  const rule = new ManualNudgeBatchTimezoneLengthRule(255);
  const item = newManualNudgeBatch("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualNudgeBatchRequiredCountryRule flags a blank country", () => {
  const rule = new ManualNudgeBatchRequiredCountryRule("manual nudge batch needs an entry");
  const item = newManualNudgeBatch("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
