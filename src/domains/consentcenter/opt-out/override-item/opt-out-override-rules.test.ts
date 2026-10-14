import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutOverrideAmountRangeRule,
  OptOutOverrideRequiredSummaryRule,
  OptOutOverrideRequiredTitleRule,
  OptOutOverrideRequiredVariantRule,
  defaultOptOutOverrideValidator,
} from "./opt-out-override-rules.js";
import { newOptOutOverride } from "./opt-out-override.js";

test("OptOutOverrideValidator reports every problem", () => {
  const validator = defaultOptOutOverrideValidator();
  const item = newOptOutOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutOverrideRequiredSummaryRule flags a blank summary", () => {
  const rule = new OptOutOverrideRequiredSummaryRule("opt out override needs this field");
  const item = newOptOutOverride("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutOverrideAmountRangeRule flags values above amount", () => {
  const rule = new OptOutOverrideAmountRangeRule(6.8, 3109.1);
  const item = newOptOutOverride("x", "y");
  item.amount = 3110.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new OptOutOverrideRequiredTitleRule("opt out override needs an entry");
  const item = newOptOutOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutOverrideRequiredVariantRule flags a blank variant", () => {
  const rule = new OptOutOverrideRequiredVariantRule("opt out override needs an entry");
  const item = newOptOutOverride("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
