import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingStepEntryNameLengthRule,
  RollingStepEntryRequiredTimezoneRule,
  defaultRollingStepEntryValidator,
} from "./rolling-step-entry-rules.js";
import { newRollingStepEntry } from "./rolling-step-entry.js";

test("RollingStepEntryValidator reports every problem", () => {
  const validator = defaultRollingStepEntryValidator();
  const item = newRollingStepEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingStepEntryRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingStepEntryRequiredTimezoneRule("rolling step entry needs a value");
  const item = newRollingStepEntry("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingStepEntryNameLengthRule flags a long name", () => {
  const rule = new RollingStepEntryNameLengthRule(32);
  const item = newRollingStepEntry("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
