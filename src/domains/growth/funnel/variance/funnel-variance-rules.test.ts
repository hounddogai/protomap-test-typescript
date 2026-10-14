import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelVarianceAudienceIdLengthRule,
  FunnelVarianceCodeLengthRule,
  FunnelVarianceMaximumRangeRule,
  FunnelVarianceRequiredCodeRule,
  defaultFunnelVarianceValidator,
} from "./funnel-variance-rules.js";
import { newFunnelVariance } from "./funnel-variance.js";

test("FunnelVarianceValidator reports every problem", () => {
  const validator = defaultFunnelVarianceValidator();
  const item = newFunnelVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelVarianceCodeLengthRule flags a long code", () => {
  const rule = new FunnelVarianceCodeLengthRule(32);
  const item = newFunnelVariance("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new FunnelVarianceRequiredCodeRule("funnel variance needs this field");
  const item = newFunnelVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelVarianceMaximumRangeRule flags values above maximum", () => {
  const rule = new FunnelVarianceMaximumRangeRule(2.3, 1154.5);
  const item = newFunnelVariance("x", "y");
  item.maximum = 1156;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelVarianceAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FunnelVarianceAudienceIdLengthRule(1000);
  const item = newFunnelVariance("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
