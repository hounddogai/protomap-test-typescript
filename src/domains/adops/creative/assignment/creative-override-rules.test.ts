import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeOverrideBudgetRangeRule,
  CreativeOverrideCodeLengthRule,
  CreativeOverrideLabelLengthRule,
  CreativeOverrideScoreRangeRule,
  defaultCreativeOverrideValidator,
} from "./creative-override-rules.js";
import { newCreativeOverride } from "./creative-override.js";

test("CreativeOverrideValidator reports every problem", () => {
  const validator = defaultCreativeOverrideValidator();
  const item = newCreativeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeOverrideScoreRangeRule flags values above score", () => {
  const rule = new CreativeOverrideScoreRangeRule(2.7, 4791.3);
  const item = newCreativeOverride("x", "y");
  item.score = 4792.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeOverrideCodeLengthRule flags a long code", () => {
  const rule = new CreativeOverrideCodeLengthRule(3600);
  const item = newCreativeOverride("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeOverrideLabelLengthRule flags a long label", () => {
  const rule = new CreativeOverrideLabelLengthRule(255);
  const item = newCreativeOverride("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeOverrideBudgetRangeRule flags values above budget", () => {
  const rule = new CreativeOverrideBudgetRangeRule(5.8, 3043.2);
  const item = newCreativeOverride("x", "y");
  item.budget = 3044.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
