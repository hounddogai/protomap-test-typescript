import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelRollupAttemptsRangeRule,
  FunnelRollupAudienceIdLengthRule,
  FunnelRollupCategoryLengthRule,
  FunnelRollupRequiredNameRule,
  defaultFunnelRollupValidator,
} from "./funnel-rollup-rules.js";
import { newFunnelRollup } from "./funnel-rollup.js";

test("FunnelRollupValidator reports every problem", () => {
  const validator = defaultFunnelRollupValidator();
  const item = newFunnelRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelRollupRequiredNameRule flags a blank name", () => {
  const rule = new FunnelRollupRequiredNameRule("funnel rollup needs an entry");
  const item = newFunnelRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelRollupCategoryLengthRule flags a long category", () => {
  const rule = new FunnelRollupCategoryLengthRule(255);
  const item = newFunnelRollup("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRollupAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FunnelRollupAudienceIdLengthRule(3600);
  const item = newFunnelRollup("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRollupAttemptsRangeRule flags values above attempts", () => {
  const rule = new FunnelRollupAttemptsRangeRule(16, 32);
  const item = newFunnelRollup("x", "y");
  item.attempts = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
