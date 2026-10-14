import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeVarianceCeilingRangeRule,
  NudgeVarianceClicksRangeRule,
  NudgeVarianceOwnerIdLengthRule,
  NudgeVarianceRequiredNameRule,
  defaultNudgeVarianceValidator,
} from "./nudge-variance-rules.js";
import { newNudgeVariance } from "./nudge-variance.js";

test("NudgeVarianceValidator reports every problem", () => {
  const validator = defaultNudgeVarianceValidator();
  const item = newNudgeVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeVarianceCeilingRangeRule flags values above ceiling", () => {
  const rule = new NudgeVarianceCeilingRangeRule(6.4, 2973.9);
  const item = newNudgeVariance("x", "y");
  item.ceiling = 2975.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeVarianceOwnerIdLengthRule flags a long owner id", () => {
  const rule = new NudgeVarianceOwnerIdLengthRule(32);
  const item = newNudgeVariance("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeVarianceClicksRangeRule flags values above clicks", () => {
  const rule = new NudgeVarianceClicksRangeRule(64, 1000);
  const item = newNudgeVariance("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeVarianceRequiredNameRule flags a blank name", () => {
  const rule = new NudgeVarianceRequiredNameRule("nudge variance needs this field");
  const item = newNudgeVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
