import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryMentionRuleCapacityRangeRule,
  PrimaryMentionRuleCodeLengthRule,
  PrimaryMentionRuleLocaleLengthRule,
  PrimaryMentionRuleRequiredSegmentRule,
  PrimaryMentionRuleVersionRangeRule,
  defaultPrimaryMentionRuleValidator,
} from "./primary-mention-rule-rules.js";
import { newPrimaryMentionRule } from "./primary-mention-rule.js";

test("PrimaryMentionRuleValidator reports every problem", () => {
  const validator = defaultPrimaryMentionRuleValidator();
  const item = newPrimaryMentionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryMentionRuleCapacityRangeRule flags values above capacity", () => {
  const rule = new PrimaryMentionRuleCapacityRangeRule(64, 1000);
  const item = newPrimaryMentionRule("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryMentionRuleCodeLengthRule flags a long code", () => {
  const rule = new PrimaryMentionRuleCodeLengthRule(16);
  const item = newPrimaryMentionRule("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMentionRuleVersionRangeRule flags values above version", () => {
  const rule = new PrimaryMentionRuleVersionRangeRule(32, 3600);
  const item = newPrimaryMentionRule("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryMentionRuleLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryMentionRuleLocaleLengthRule(16);
  const item = newPrimaryMentionRule("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMentionRuleRequiredSegmentRule flags a blank segment", () => {
  const rule = new PrimaryMentionRuleRequiredSegmentRule("primary mention rule needs an entry");
  const item = newPrimaryMentionRule("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
