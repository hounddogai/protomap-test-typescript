import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultOptOutRuleChannelLengthRule,
  DefaultOptOutRuleCodeLengthRule,
  DefaultOptOutRuleExpiresAtRangeRule,
  DefaultOptOutRuleMarginRangeRule,
  DefaultOptOutRuleNameLengthRule,
  defaultDefaultOptOutRuleValidator,
} from "./default-opt-out-rule-rules.js";
import { newDefaultOptOutRule } from "./default-opt-out-rule.js";

test("DefaultOptOutRuleValidator reports every problem", () => {
  const validator = defaultDefaultOptOutRuleValidator();
  const item = newDefaultOptOutRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultOptOutRuleMarginRangeRule flags values above margin", () => {
  const rule = new DefaultOptOutRuleMarginRangeRule(3.2, 4176.9);
  const item = newDefaultOptOutRule("x", "y");
  item.margin = 4178.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultOptOutRuleChannelLengthRule flags a long channel", () => {
  const rule = new DefaultOptOutRuleChannelLengthRule(32);
  const item = newDefaultOptOutRule("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultOptOutRuleExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DefaultOptOutRuleExpiresAtRangeRule(255, 86400);
  const item = newDefaultOptOutRule("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultOptOutRuleNameLengthRule flags a long name", () => {
  const rule = new DefaultOptOutRuleNameLengthRule(1000);
  const item = newDefaultOptOutRule("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultOptOutRuleCodeLengthRule flags a long code", () => {
  const rule = new DefaultOptOutRuleCodeLengthRule(120);
  const item = newDefaultOptOutRule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
