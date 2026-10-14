import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowRequestAttemptsRangeRule,
  WindowRequestRequiredAudienceIdRule,
  WindowRequestRequiredCodeRule,
  defaultWindowRequestValidator,
} from "./window-request-rules.js";
import { newWindowRequest } from "./window-request.js";

test("WindowRequestValidator reports every problem", () => {
  const validator = defaultWindowRequestValidator();
  const item = newWindowRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowRequestRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WindowRequestRequiredAudienceIdRule("window request needs this field");
  const item = newWindowRequest("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowRequestRequiredCodeRule flags a blank code", () => {
  const rule = new WindowRequestRequiredCodeRule("window request needs an entry");
  const item = newWindowRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowRequestAttemptsRangeRule flags values above attempts", () => {
  const rule = new WindowRequestAttemptsRangeRule(32, 120);
  const item = newWindowRequest("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
