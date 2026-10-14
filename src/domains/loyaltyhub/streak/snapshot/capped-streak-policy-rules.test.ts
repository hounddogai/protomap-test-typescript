import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStreakPolicyCodeLengthRule,
  CappedStreakPolicyLabelLengthRule,
  CappedStreakPolicyRequiredLabelRule,
  defaultCappedStreakPolicyValidator,
} from "./capped-streak-policy-rules.js";
import { newCappedStreakPolicy } from "./capped-streak-policy.js";

test("CappedStreakPolicyValidator reports every problem", () => {
  const validator = defaultCappedStreakPolicyValidator();
  const item = newCappedStreakPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStreakPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new CappedStreakPolicyRequiredLabelRule("capped streak policy needs an entry");
  const item = newCappedStreakPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStreakPolicyLabelLengthRule flags a long label", () => {
  const rule = new CappedStreakPolicyLabelLengthRule(64);
  const item = newCappedStreakPolicy("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedStreakPolicyCodeLengthRule flags a long code", () => {
  const rule = new CappedStreakPolicyCodeLengthRule(80);
  const item = newCappedStreakPolicy("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
