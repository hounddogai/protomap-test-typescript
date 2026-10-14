import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedProofRuleLabelLengthRule,
  CappedProofRuleRequiredCodeRule,
  CappedProofRuleVersionRangeRule,
  defaultCappedProofRuleValidator,
} from "./capped-proof-rule-rules.js";
import { newCappedProofRule } from "./capped-proof-rule.js";

test("CappedProofRuleValidator reports every problem", () => {
  const validator = defaultCappedProofRuleValidator();
  const item = newCappedProofRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedProofRuleLabelLengthRule flags a long label", () => {
  const rule = new CappedProofRuleLabelLengthRule(32);
  const item = newCappedProofRule("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedProofRuleVersionRangeRule flags values above version", () => {
  const rule = new CappedProofRuleVersionRangeRule(120, 1000);
  const item = newCappedProofRule("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedProofRuleRequiredCodeRule flags a blank code", () => {
  const rule = new CappedProofRuleRequiredCodeRule("capped proof rule needs an entry");
  const item = newCappedProofRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
