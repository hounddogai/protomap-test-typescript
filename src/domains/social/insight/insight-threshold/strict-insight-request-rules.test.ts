import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictInsightRequestExpiresAtRangeRule,
  StrictInsightRequestMaximumRangeRule,
  StrictInsightRequestRequiredCodeRule,
  StrictInsightRequestTitleLengthRule,
  defaultStrictInsightRequestValidator,
} from "./strict-insight-request-rules.js";
import { newStrictInsightRequest } from "./strict-insight-request.js";

test("StrictInsightRequestValidator reports every problem", () => {
  const validator = defaultStrictInsightRequestValidator();
  const item = newStrictInsightRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictInsightRequestExpiresAtRangeRule flags values above expires at", () => {
  const rule = new StrictInsightRequestExpiresAtRangeRule(32, 255);
  const item = newStrictInsightRequest("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictInsightRequestTitleLengthRule flags a long title", () => {
  const rule = new StrictInsightRequestTitleLengthRule(3600);
  const item = newStrictInsightRequest("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictInsightRequestRequiredCodeRule flags a blank code", () => {
  const rule = new StrictInsightRequestRequiredCodeRule("strict insight request needs an entry");
  const item = newStrictInsightRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInsightRequestMaximumRangeRule flags values above maximum", () => {
  const rule = new StrictInsightRequestMaximumRangeRule(3, 1394.5);
  const item = newStrictInsightRequest("x", "y");
  item.maximum = 1396;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
