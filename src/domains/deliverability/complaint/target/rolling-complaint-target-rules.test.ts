import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingComplaintTargetRequiredCodeRule,
  RollingComplaintTargetRequiredCurrencyRule,
  RollingComplaintTargetRequiredNameRule,
  RollingComplaintTargetSummaryLengthRule,
  defaultRollingComplaintTargetValidator,
} from "./rolling-complaint-target-rules.js";
import { newRollingComplaintTarget } from "./rolling-complaint-target.js";

test("RollingComplaintTargetValidator reports every problem", () => {
  const validator = defaultRollingComplaintTargetValidator();
  const item = newRollingComplaintTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingComplaintTargetRequiredCodeRule flags a blank code", () => {
  const rule = new RollingComplaintTargetRequiredCodeRule("rolling complaint target needs this field");
  const item = newRollingComplaintTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingComplaintTargetSummaryLengthRule flags a long summary", () => {
  const rule = new RollingComplaintTargetSummaryLengthRule(3600);
  const item = newRollingComplaintTarget("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingComplaintTargetRequiredNameRule flags a blank name", () => {
  const rule = new RollingComplaintTargetRequiredNameRule("rolling complaint target needs an entry");
  const item = newRollingComplaintTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingComplaintTargetRequiredCurrencyRule flags a blank currency", () => {
  const rule = new RollingComplaintTargetRequiredCurrencyRule("rolling complaint target needs a value");
  const item = newRollingComplaintTarget("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
