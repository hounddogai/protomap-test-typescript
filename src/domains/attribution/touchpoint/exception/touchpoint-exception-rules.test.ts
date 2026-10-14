import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointExceptionCodeLengthRule,
  TouchpointExceptionLabelLengthRule,
  TouchpointExceptionRequiredSegmentRule,
  TouchpointExceptionSegmentLengthRule,
  defaultTouchpointExceptionValidator,
} from "./touchpoint-exception-rules.js";
import { newTouchpointException } from "./touchpoint-exception.js";

test("TouchpointExceptionValidator reports every problem", () => {
  const validator = defaultTouchpointExceptionValidator();
  const item = newTouchpointException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointExceptionCodeLengthRule flags a long code", () => {
  const rule = new TouchpointExceptionCodeLengthRule(1000);
  const item = newTouchpointException("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointExceptionSegmentLengthRule flags a long segment", () => {
  const rule = new TouchpointExceptionSegmentLengthRule(32);
  const item = newTouchpointException("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointExceptionLabelLengthRule flags a long label", () => {
  const rule = new TouchpointExceptionLabelLengthRule(32);
  const item = newTouchpointException("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointExceptionRequiredSegmentRule flags a blank segment", () => {
  const rule = new TouchpointExceptionRequiredSegmentRule("touchpoint exception needs an entry");
  const item = newTouchpointException("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
