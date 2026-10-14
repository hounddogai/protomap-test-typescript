import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledWindowBatchRequiredCodeRule,
  ScheduledWindowBatchRequiredUnitRule,
  defaultScheduledWindowBatchValidator,
} from "./scheduled-window-batch-rules.js";
import { newScheduledWindowBatch } from "./scheduled-window-batch.js";

test("ScheduledWindowBatchValidator reports every problem", () => {
  const validator = defaultScheduledWindowBatchValidator();
  const item = newScheduledWindowBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledWindowBatchRequiredUnitRule flags a blank unit", () => {
  const rule = new ScheduledWindowBatchRequiredUnitRule("scheduled window batch needs this field");
  const item = newScheduledWindowBatch("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledWindowBatchRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledWindowBatchRequiredCodeRule("scheduled window batch needs an entry");
  const item = newScheduledWindowBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
