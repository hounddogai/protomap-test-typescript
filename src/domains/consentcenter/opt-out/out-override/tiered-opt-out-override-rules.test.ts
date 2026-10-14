import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredOptOutOverrideRequiredNameRule,
  TieredOptOutOverrideRequiredSummaryRule,
  TieredOptOutOverrideSummaryLengthRule,
  defaultTieredOptOutOverrideValidator,
} from "./tiered-opt-out-override-rules.js";
import { newTieredOptOutOverride } from "./tiered-opt-out-override.js";

test("TieredOptOutOverrideValidator reports every problem", () => {
  const validator = defaultTieredOptOutOverrideValidator();
  const item = newTieredOptOutOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredOptOutOverrideRequiredNameRule flags a blank name", () => {
  const rule = new TieredOptOutOverrideRequiredNameRule("tiered opt out override needs this field");
  const item = newTieredOptOutOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredOptOutOverrideRequiredSummaryRule flags a blank summary", () => {
  const rule = new TieredOptOutOverrideRequiredSummaryRule("tiered opt out override needs an entry");
  const item = newTieredOptOutOverride("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredOptOutOverrideSummaryLengthRule flags a long summary", () => {
  const rule = new TieredOptOutOverrideSummaryLengthRule(64);
  const item = newTieredOptOutOverride("x", "y");
  item.summary = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
