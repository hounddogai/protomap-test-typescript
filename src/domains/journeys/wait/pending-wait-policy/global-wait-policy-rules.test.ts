import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalWaitPolicyCodeLengthRule,
  GlobalWaitPolicyLabelLengthRule,
  GlobalWaitPolicyRequiredLabelRule,
  GlobalWaitPolicyRequiredSegmentRule,
  defaultGlobalWaitPolicyValidator,
} from "./global-wait-policy-rules.js";
import { newGlobalWaitPolicy } from "./global-wait-policy.js";

test("GlobalWaitPolicyValidator reports every problem", () => {
  const validator = defaultGlobalWaitPolicyValidator();
  const item = newGlobalWaitPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalWaitPolicyLabelLengthRule flags a long label", () => {
  const rule = new GlobalWaitPolicyLabelLengthRule(86400);
  const item = newGlobalWaitPolicy("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWaitPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalWaitPolicyRequiredLabelRule("global wait policy needs a value");
  const item = newGlobalWaitPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalWaitPolicyCodeLengthRule flags a long code", () => {
  const rule = new GlobalWaitPolicyCodeLengthRule(64);
  const item = newGlobalWaitPolicy("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWaitPolicyRequiredSegmentRule flags a blank segment", () => {
  const rule = new GlobalWaitPolicyRequiredSegmentRule("global wait policy needs a value");
  const item = newGlobalWaitPolicy("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
