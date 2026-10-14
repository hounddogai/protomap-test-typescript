import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelOverrideAmountRangeRule,
  ModelOverrideDurationMinutesRangeRule,
  ModelOverrideTitleLengthRule,
  defaultModelOverrideValidator,
} from "./model-override-rules.js";
import { newModelOverride } from "./model-override.js";

test("ModelOverrideValidator reports every problem", () => {
  const validator = defaultModelOverrideValidator();
  const item = newModelOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelOverrideDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ModelOverrideDurationMinutesRangeRule(16, 3600);
  const item = newModelOverride("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelOverrideAmountRangeRule flags values above amount", () => {
  const rule = new ModelOverrideAmountRangeRule(9.8, 4639.8);
  const item = newModelOverride("x", "y");
  item.amount = 4641.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelOverrideTitleLengthRule flags a long title", () => {
  const rule = new ModelOverrideTitleLengthRule(64);
  const item = newModelOverride("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
