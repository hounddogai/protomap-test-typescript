import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPostRuleCodeLengthRule,
  LenientPostRuleDescriptionLengthRule,
  LenientPostRuleScoreRangeRule,
  LenientPostRuleTitleLengthRule,
  defaultLenientPostRuleValidator,
} from "./lenient-post-rule-rules.js";
import { newLenientPostRule } from "./lenient-post-rule.js";

test("LenientPostRuleValidator reports every problem", () => {
  const validator = defaultLenientPostRuleValidator();
  const item = newLenientPostRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPostRuleScoreRangeRule flags values above score", () => {
  const rule = new LenientPostRuleScoreRangeRule(2, 1498.5);
  const item = newLenientPostRule("x", "y");
  item.score = 1500;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPostRuleCodeLengthRule flags a long code", () => {
  const rule = new LenientPostRuleCodeLengthRule(255);
  const item = newLenientPostRule("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostRuleTitleLengthRule flags a long title", () => {
  const rule = new LenientPostRuleTitleLengthRule(255);
  const item = newLenientPostRule("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostRuleDescriptionLengthRule flags a long description", () => {
  const rule = new LenientPostRuleDescriptionLengthRule(32);
  const item = newLenientPostRule("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
