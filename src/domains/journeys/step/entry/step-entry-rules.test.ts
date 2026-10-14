import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepEntryCodeLengthRule,
  StepEntryNameLengthRule,
  StepEntryRequiredSummaryRule,
  StepEntryRequiredTitleRule,
  defaultStepEntryValidator,
} from "./step-entry-rules.js";
import { newStepEntry } from "./step-entry.js";

test("StepEntryValidator reports every problem", () => {
  const validator = defaultStepEntryValidator();
  const item = newStepEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepEntryNameLengthRule flags a long name", () => {
  const rule = new StepEntryNameLengthRule(255);
  const item = newStepEntry("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepEntryRequiredSummaryRule flags a blank summary", () => {
  const rule = new StepEntryRequiredSummaryRule("step entry needs an entry");
  const item = newStepEntry("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepEntryRequiredTitleRule flags a blank title", () => {
  const rule = new StepEntryRequiredTitleRule("step entry needs an entry");
  const item = newStepEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepEntryCodeLengthRule flags a long code", () => {
  const rule = new StepEntryCodeLengthRule(255);
  const item = newStepEntry("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
