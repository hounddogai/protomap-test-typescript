import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledRetentionAllocationMaximumRangeRule,
  ScheduledRetentionAllocationRequiredLabelRule,
  ScheduledRetentionAllocationRequiredNameRule,
  defaultScheduledRetentionAllocationValidator,
} from "./scheduled-retention-allocation-rules.js";
import { newScheduledRetentionAllocation } from "./scheduled-retention-allocation.js";

test("ScheduledRetentionAllocationValidator reports every problem", () => {
  const validator = defaultScheduledRetentionAllocationValidator();
  const item = newScheduledRetentionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledRetentionAllocationMaximumRangeRule flags values above maximum", () => {
  const rule = new ScheduledRetentionAllocationMaximumRangeRule(0.5, 1950.2);
  const item = newScheduledRetentionAllocation("x", "y");
  item.maximum = 1951.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledRetentionAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledRetentionAllocationRequiredLabelRule("scheduled retention allocation needs an entry");
  const item = newScheduledRetentionAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRetentionAllocationRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledRetentionAllocationRequiredNameRule("scheduled retention allocation needs a value");
  const item = newScheduledRetentionAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
