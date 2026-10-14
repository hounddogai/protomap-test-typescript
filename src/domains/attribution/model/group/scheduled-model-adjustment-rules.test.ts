import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledModelAdjustmentCodeLengthRule,
  ScheduledModelAdjustmentFrequencyCapRangeRule,
  ScheduledModelAdjustmentRequiredCodeRule,
  ScheduledModelAdjustmentRequiredOwnerIdRule,
  defaultScheduledModelAdjustmentValidator,
} from "./scheduled-model-adjustment-rules.js";
import { newScheduledModelAdjustment } from "./scheduled-model-adjustment.js";

test("ScheduledModelAdjustmentValidator reports every problem", () => {
  const validator = defaultScheduledModelAdjustmentValidator();
  const item = newScheduledModelAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledModelAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new ScheduledModelAdjustmentCodeLengthRule(120);
  const item = newScheduledModelAdjustment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledModelAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledModelAdjustmentRequiredCodeRule("scheduled model adjustment needs an entry");
  const item = newScheduledModelAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledModelAdjustmentRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ScheduledModelAdjustmentRequiredOwnerIdRule("scheduled model adjustment needs this field");
  const item = newScheduledModelAdjustment("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledModelAdjustmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ScheduledModelAdjustmentFrequencyCapRangeRule(255, 1000);
  const item = newScheduledModelAdjustment("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
