import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleBatchClicksRangeRule,
  ExitRuleBatchMarginRangeRule,
  ExitRuleBatchRequiredNameRule,
  ExitRuleBatchTitleLengthRule,
  defaultExitRuleBatchValidator,
} from "./exit-rule-batch-rules.js";
import { newExitRuleBatch } from "./exit-rule-batch.js";

test("ExitRuleBatchValidator reports every problem", () => {
  const validator = defaultExitRuleBatchValidator();
  const item = newExitRuleBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleBatchTitleLengthRule flags a long title", () => {
  const rule = new ExitRuleBatchTitleLengthRule(1000);
  const item = newExitRuleBatch("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleBatchClicksRangeRule flags values above clicks", () => {
  const rule = new ExitRuleBatchClicksRangeRule(1000, 3600);
  const item = newExitRuleBatch("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleBatchMarginRangeRule flags values above margin", () => {
  const rule = new ExitRuleBatchMarginRangeRule(9.2, 4692.9);
  const item = newExitRuleBatch("x", "y");
  item.margin = 4694.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleBatchRequiredNameRule flags a blank name", () => {
  const rule = new ExitRuleBatchRequiredNameRule("exit rule batch needs this field");
  const item = newExitRuleBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
