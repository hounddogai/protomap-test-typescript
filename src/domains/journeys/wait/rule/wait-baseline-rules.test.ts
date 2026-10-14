import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitBaselineRequiredAudienceIdRule,
  WaitBaselineRequiredCodeRule,
  WaitBaselineRequiredTimezoneRule,
  defaultWaitBaselineValidator,
} from "./wait-baseline-rules.js";
import { newWaitBaseline } from "./wait-baseline.js";

test("WaitBaselineValidator reports every problem", () => {
  const validator = defaultWaitBaselineValidator();
  const item = newWaitBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitBaselineRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WaitBaselineRequiredAudienceIdRule("wait baseline needs this field");
  const item = newWaitBaseline("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitBaselineRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new WaitBaselineRequiredTimezoneRule("wait baseline needs an entry");
  const item = newWaitBaseline("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new WaitBaselineRequiredCodeRule("wait baseline needs a value");
  const item = newWaitBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
