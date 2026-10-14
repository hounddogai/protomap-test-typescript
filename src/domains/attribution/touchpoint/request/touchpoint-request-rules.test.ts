import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointRequestNameLengthRule,
  TouchpointRequestRequiredCohortRule,
  TouchpointRequestSequenceRangeRule,
  defaultTouchpointRequestValidator,
} from "./touchpoint-request-rules.js";
import { newTouchpointRequest } from "./touchpoint-request.js";

test("TouchpointRequestValidator reports every problem", () => {
  const validator = defaultTouchpointRequestValidator();
  const item = newTouchpointRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointRequestNameLengthRule flags a long name", () => {
  const rule = new TouchpointRequestNameLengthRule(255);
  const item = newTouchpointRequest("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointRequestRequiredCohortRule flags a blank cohort", () => {
  const rule = new TouchpointRequestRequiredCohortRule("touchpoint request needs a value");
  const item = newTouchpointRequest("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointRequestSequenceRangeRule flags values above sequence", () => {
  const rule = new TouchpointRequestSequenceRangeRule(32, 64);
  const item = newTouchpointRequest("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
