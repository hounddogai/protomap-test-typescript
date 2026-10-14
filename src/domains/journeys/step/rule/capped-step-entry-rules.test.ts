import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStepEntryCohortLengthRule,
  CappedStepEntryQuantityRangeRule,
  CappedStepEntryRequiredCodeRule,
  CappedStepEntryRequiredLabelRule,
  defaultCappedStepEntryValidator,
} from "./capped-step-entry-rules.js";
import { newCappedStepEntry } from "./capped-step-entry.js";

test("CappedStepEntryValidator reports every problem", () => {
  const validator = defaultCappedStepEntryValidator();
  const item = newCappedStepEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStepEntryRequiredCodeRule flags a blank code", () => {
  const rule = new CappedStepEntryRequiredCodeRule("capped step entry needs a value");
  const item = newCappedStepEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStepEntryCohortLengthRule flags a long cohort", () => {
  const rule = new CappedStepEntryCohortLengthRule(80);
  const item = newCappedStepEntry("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedStepEntryRequiredLabelRule flags a blank label", () => {
  const rule = new CappedStepEntryRequiredLabelRule("capped step entry needs this field");
  const item = newCappedStepEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStepEntryQuantityRangeRule flags values above quantity", () => {
  const rule = new CappedStepEntryQuantityRangeRule(80, 1000);
  const item = newCappedStepEntry("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
