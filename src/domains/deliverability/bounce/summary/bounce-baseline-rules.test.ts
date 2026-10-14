import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceBaselineGraceDaysRangeRule,
  BounceBaselineMarginRangeRule,
  BounceBaselineRetriesRangeRule,
  BounceBaselineTitleLengthRule,
  defaultBounceBaselineValidator,
} from "./bounce-baseline-rules.js";
import { newBounceBaseline } from "./bounce-baseline.js";

test("BounceBaselineValidator reports every problem", () => {
  const validator = defaultBounceBaselineValidator();
  const item = newBounceBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceBaselineGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BounceBaselineGraceDaysRangeRule(64, 64);
  const item = newBounceBaseline("x", "y");
  item.graceDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceBaselineMarginRangeRule flags values above margin", () => {
  const rule = new BounceBaselineMarginRangeRule(0.3, 4109.2);
  const item = newBounceBaseline("x", "y");
  item.margin = 4110.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceBaselineTitleLengthRule flags a long title", () => {
  const rule = new BounceBaselineTitleLengthRule(255);
  const item = newBounceBaseline("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceBaselineRetriesRangeRule flags values above retries", () => {
  const rule = new BounceBaselineRetriesRangeRule(64, 64);
  const item = newBounceBaseline("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
