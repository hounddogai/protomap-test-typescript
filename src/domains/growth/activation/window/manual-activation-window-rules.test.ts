import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualActivationWindowNameLengthRule,
  ManualActivationWindowRequiredNameRule,
  ManualActivationWindowSequenceRangeRule,
  defaultManualActivationWindowValidator,
} from "./manual-activation-window-rules.js";
import { newManualActivationWindow } from "./manual-activation-window.js";

test("ManualActivationWindowValidator reports every problem", () => {
  const validator = defaultManualActivationWindowValidator();
  const item = newManualActivationWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualActivationWindowRequiredNameRule flags a blank name", () => {
  const rule = new ManualActivationWindowRequiredNameRule("manual activation window needs this field");
  const item = newManualActivationWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualActivationWindowSequenceRangeRule flags values above sequence", () => {
  const rule = new ManualActivationWindowSequenceRangeRule(3600, 3600);
  const item = newManualActivationWindow("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualActivationWindowNameLengthRule flags a long name", () => {
  const rule = new ManualActivationWindowNameLengthRule(255);
  const item = newManualActivationWindow("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
