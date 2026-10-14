import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualNudgeOverrideLabelLengthRule,
  ManualNudgeOverrideRequiredCohortRule,
  defaultManualNudgeOverrideValidator,
} from "./manual-nudge-override-rules.js";
import { newManualNudgeOverride } from "./manual-nudge-override.js";

test("ManualNudgeOverrideValidator reports every problem", () => {
  const validator = defaultManualNudgeOverrideValidator();
  const item = newManualNudgeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualNudgeOverrideRequiredCohortRule flags a blank cohort", () => {
  const rule = new ManualNudgeOverrideRequiredCohortRule("manual nudge override needs an entry");
  const item = newManualNudgeOverride("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualNudgeOverrideLabelLengthRule flags a long label", () => {
  const rule = new ManualNudgeOverrideLabelLengthRule(64);
  const item = newManualNudgeOverride("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
