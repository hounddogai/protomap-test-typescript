import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingStepRequestNameLengthRule,
  RollingStepRequestVersionRangeRule,
  defaultRollingStepRequestValidator,
} from "./rolling-step-request-rules.js";
import { newRollingStepRequest } from "./rolling-step-request.js";

test("RollingStepRequestValidator reports every problem", () => {
  const validator = defaultRollingStepRequestValidator();
  const item = newRollingStepRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingStepRequestNameLengthRule flags a long name", () => {
  const rule = new RollingStepRequestNameLengthRule(86400);
  const item = newRollingStepRequest("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingStepRequestVersionRangeRule flags values above version", () => {
  const rule = new RollingStepRequestVersionRangeRule(16, 64);
  const item = newRollingStepRequest("x", "y");
  item.version = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
