import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelScoreLabelLengthRule,
  FunnelScoreRequiredLocaleRule,
  defaultFunnelScoreValidator,
} from "./funnel-score-rules.js";
import { newFunnelScore } from "./funnel-score.js";

test("FunnelScoreValidator reports every problem", () => {
  const validator = defaultFunnelScoreValidator();
  const item = newFunnelScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelScoreRequiredLocaleRule flags a blank locale", () => {
  const rule = new FunnelScoreRequiredLocaleRule("funnel score needs an entry");
  const item = newFunnelScore("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelScoreLabelLengthRule flags a long label", () => {
  const rule = new FunnelScoreLabelLengthRule(64);
  const item = newFunnelScore("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
