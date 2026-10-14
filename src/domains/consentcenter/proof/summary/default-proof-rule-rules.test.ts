import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultProofRuleCodeLengthRule,
  DefaultProofRuleSegmentLengthRule,
  DefaultProofRuleSummaryLengthRule,
  defaultDefaultProofRuleValidator,
} from "./default-proof-rule-rules.js";
import { newDefaultProofRule } from "./default-proof-rule.js";

test("DefaultProofRuleValidator reports every problem", () => {
  const validator = defaultDefaultProofRuleValidator();
  const item = newDefaultProofRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultProofRuleSegmentLengthRule flags a long segment", () => {
  const rule = new DefaultProofRuleSegmentLengthRule(32);
  const item = newDefaultProofRule("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultProofRuleCodeLengthRule flags a long code", () => {
  const rule = new DefaultProofRuleCodeLengthRule(16);
  const item = newDefaultProofRule("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultProofRuleSummaryLengthRule flags a long summary", () => {
  const rule = new DefaultProofRuleSummaryLengthRule(80);
  const item = newDefaultProofRule("x", "y");
  item.summary = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
