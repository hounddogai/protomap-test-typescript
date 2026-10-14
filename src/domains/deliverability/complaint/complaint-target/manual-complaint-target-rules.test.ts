import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualComplaintTargetJourneyIdLengthRule,
  ManualComplaintTargetLocaleLengthRule,
  ManualComplaintTargetRequiredCodeRule,
  ManualComplaintTargetRequiredJourneyIdRule,
  ManualComplaintTargetRequiredLocaleRule,
  defaultManualComplaintTargetValidator,
} from "./manual-complaint-target-rules.js";
import { newManualComplaintTarget } from "./manual-complaint-target.js";

test("ManualComplaintTargetValidator reports every problem", () => {
  const validator = defaultManualComplaintTargetValidator();
  const item = newManualComplaintTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualComplaintTargetRequiredLocaleRule flags a blank locale", () => {
  const rule = new ManualComplaintTargetRequiredLocaleRule("manual complaint target needs this field");
  const item = newManualComplaintTarget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualComplaintTargetLocaleLengthRule flags a long locale", () => {
  const rule = new ManualComplaintTargetLocaleLengthRule(255);
  const item = newManualComplaintTarget("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualComplaintTargetRequiredCodeRule flags a blank code", () => {
  const rule = new ManualComplaintTargetRequiredCodeRule("manual complaint target needs a value");
  const item = newManualComplaintTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualComplaintTargetJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ManualComplaintTargetJourneyIdLengthRule(80);
  const item = newManualComplaintTarget("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualComplaintTargetRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ManualComplaintTargetRequiredJourneyIdRule("manual complaint target needs this field");
  const item = newManualComplaintTarget("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
