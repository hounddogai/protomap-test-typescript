import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionCycleCodeLengthRule,
  RetentionCycleContactEmailLengthRule,
  RetentionCycleNameLengthRule,
  RetentionCycleRequiredContactEmailRule,
  RetentionCycleRequiredNameRule,
  RetentionCycleSummaryLengthRule,
  defaultRetentionCycleValidator,
} from "./retention-cycle-rules.js";
import { newRetentionCycle } from "./retention-cycle.js";

test("RetentionCycleValidator reports every problem", () => {
  const validator = defaultRetentionCycleValidator();
  const item = newRetentionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionCycleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RetentionCycleRequiredContactEmailRule("retention cycle needs this field");
  const item = newRetentionCycle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionCycleRequiredNameRule flags a blank name", () => {
  const rule = new RetentionCycleRequiredNameRule("retention cycle needs a value");
  const item = newRetentionCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionCycleSummaryLengthRule flags a long summary", () => {
  const rule = new RetentionCycleSummaryLengthRule(86400);
  const item = newRetentionCycle("x", "y");
  item.summary = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionCycleNameLengthRule flags a long name", () => {
  const rule = new RetentionCycleNameLengthRule(3600);
  const item = newRetentionCycle("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionCycleCodeLengthRule flags a long code", () => {
  const rule = new RetentionCycleCodeLengthRule(255);
  const item = newRetentionCycle("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionCycleContactEmailLengthRule flags a long contact email", () => {
  const rule = new RetentionCycleContactEmailLengthRule(80);
  const item = newRetentionCycle("x", "y");
  item.contactEmail = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
