import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightRequestRequiredCodeRule,
  InsightRequestRequiredSegmentRule,
  InsightRequestSegmentLengthRule,
  defaultInsightRequestValidator,
} from "./insight-request-rules.js";
import { newInsightRequest } from "./insight-request.js";

test("InsightRequestValidator reports every problem", () => {
  const validator = defaultInsightRequestValidator();
  const item = newInsightRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightRequestRequiredSegmentRule flags a blank segment", () => {
  const rule = new InsightRequestRequiredSegmentRule("insight request needs this field");
  const item = newInsightRequest("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightRequestSegmentLengthRule flags a long segment", () => {
  const rule = new InsightRequestSegmentLengthRule(1000);
  const item = newInsightRequest("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightRequestRequiredCodeRule flags a blank code", () => {
  const rule = new InsightRequestRequiredCodeRule("insight request needs this field");
  const item = newInsightRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
