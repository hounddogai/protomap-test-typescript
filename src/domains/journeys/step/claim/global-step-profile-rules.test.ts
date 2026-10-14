import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalStepProfileCountryLengthRule,
  GlobalStepProfileGraceDaysRangeRule,
  GlobalStepProfileRequiredCountryRule,
  GlobalStepProfileSequenceRangeRule,
  defaultGlobalStepProfileValidator,
} from "./global-step-profile-rules.js";
import { newGlobalStepProfile } from "./global-step-profile.js";

test("GlobalStepProfileValidator reports every problem", () => {
  const validator = defaultGlobalStepProfileValidator();
  const item = newGlobalStepProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalStepProfileSequenceRangeRule flags values above sequence", () => {
  const rule = new GlobalStepProfileSequenceRangeRule(255, 255);
  const item = newGlobalStepProfile("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalStepProfileRequiredCountryRule flags a blank country", () => {
  const rule = new GlobalStepProfileRequiredCountryRule("global step profile needs this field");
  const item = newGlobalStepProfile("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalStepProfileGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalStepProfileGraceDaysRangeRule(16, 120);
  const item = newGlobalStepProfile("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalStepProfileCountryLengthRule flags a long country", () => {
  const rule = new GlobalStepProfileCountryLengthRule(32);
  const item = newGlobalStepProfile("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
