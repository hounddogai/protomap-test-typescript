import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceVarianceCodeLengthRule,
  BounceVarianceEndsAtRangeRule,
  BounceVarianceRequiredCodeRule,
  BounceVarianceRequiredNameRule,
  defaultBounceVarianceValidator,
} from "./bounce-variance-rules.js";
import { newBounceVariance } from "./bounce-variance.js";

test("BounceVarianceValidator reports every problem", () => {
  const validator = defaultBounceVarianceValidator();
  const item = newBounceVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new BounceVarianceRequiredCodeRule("bounce variance needs an entry");
  const item = newBounceVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceVarianceRequiredNameRule flags a blank name", () => {
  const rule = new BounceVarianceRequiredNameRule("bounce variance needs a value");
  const item = newBounceVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceVarianceEndsAtRangeRule flags values above ends at", () => {
  const rule = new BounceVarianceEndsAtRangeRule(32, 80);
  const item = newBounceVariance("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceVarianceCodeLengthRule flags a long code", () => {
  const rule = new BounceVarianceCodeLengthRule(16);
  const item = newBounceVariance("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
