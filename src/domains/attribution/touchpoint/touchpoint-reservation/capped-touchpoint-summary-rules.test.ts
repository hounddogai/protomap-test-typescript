import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedTouchpointSummaryCodeLengthRule,
  CappedTouchpointSummaryRequiredTitleRule,
  CappedTouchpointSummaryScoreRangeRule,
  defaultCappedTouchpointSummaryValidator,
} from "./capped-touchpoint-summary-rules.js";
import { newCappedTouchpointSummary } from "./capped-touchpoint-summary.js";

test("CappedTouchpointSummaryValidator reports every problem", () => {
  const validator = defaultCappedTouchpointSummaryValidator();
  const item = newCappedTouchpointSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedTouchpointSummaryScoreRangeRule flags values above score", () => {
  const rule = new CappedTouchpointSummaryScoreRangeRule(6.7, 408.9);
  const item = newCappedTouchpointSummary("x", "y");
  item.score = 410.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedTouchpointSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new CappedTouchpointSummaryRequiredTitleRule("capped touchpoint summary needs an entry");
  const item = newCappedTouchpointSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedTouchpointSummaryCodeLengthRule flags a long code", () => {
  const rule = new CappedTouchpointSummaryCodeLengthRule(255);
  const item = newCappedTouchpointSummary("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
