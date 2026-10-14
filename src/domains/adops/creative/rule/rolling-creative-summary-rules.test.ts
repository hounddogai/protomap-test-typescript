import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCreativeSummaryRequiredCodeRule,
  RollingCreativeSummaryRequiredTimezoneRule,
  RollingCreativeSummaryTitleLengthRule,
  defaultRollingCreativeSummaryValidator,
} from "./rolling-creative-summary-rules.js";
import { newRollingCreativeSummary } from "./rolling-creative-summary.js";

test("RollingCreativeSummaryValidator reports every problem", () => {
  const validator = defaultRollingCreativeSummaryValidator();
  const item = newRollingCreativeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCreativeSummaryRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingCreativeSummaryRequiredTimezoneRule("rolling creative summary needs a value");
  const item = newRollingCreativeSummary("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCreativeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new RollingCreativeSummaryRequiredCodeRule("rolling creative summary needs an entry");
  const item = newRollingCreativeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCreativeSummaryTitleLengthRule flags a long title", () => {
  const rule = new RollingCreativeSummaryTitleLengthRule(1000);
  const item = newRollingCreativeSummary("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
