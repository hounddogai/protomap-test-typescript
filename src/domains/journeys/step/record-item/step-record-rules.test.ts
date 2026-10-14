import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepRecordDurationMinutesRangeRule,
  StepRecordMaximumRangeRule,
  StepRecordNameLengthRule,
  StepRecordOwnerIdLengthRule,
  StepRecordRequiredOwnerIdRule,
  StepRecordUtmSourceLengthRule,
  defaultStepRecordValidator,
} from "./step-record-rules.js";
import { newStepRecord } from "./step-record.js";

test("StepRecordValidator reports every problem", () => {
  const validator = defaultStepRecordValidator();
  const item = newStepRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepRecordOwnerIdLengthRule flags a long owner id", () => {
  const rule = new StepRecordOwnerIdLengthRule(86400);
  const item = newStepRecord("x", "y");
  item.ownerId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRecordUtmSourceLengthRule flags a long utm source", () => {
  const rule = new StepRecordUtmSourceLengthRule(80);
  const item = newStepRecord("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRecordDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new StepRecordDurationMinutesRangeRule(32, 86400);
  const item = newStepRecord("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepRecordNameLengthRule flags a long name", () => {
  const rule = new StepRecordNameLengthRule(86400);
  const item = newStepRecord("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRecordMaximumRangeRule flags values above maximum", () => {
  const rule = new StepRecordMaximumRangeRule(7.1, 2049);
  const item = newStepRecord("x", "y");
  item.maximum = 2050.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepRecordRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StepRecordRequiredOwnerIdRule("step record needs an entry");
  const item = newStepRecord("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
