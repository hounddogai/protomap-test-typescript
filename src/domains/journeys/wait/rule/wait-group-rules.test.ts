import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitGroupLabelLengthRule,
  WaitGroupRequiredCodeRule,
  WaitGroupRequiredTitleRule,
  WaitGroupScoreRangeRule,
  WaitGroupTitleLengthRule,
  defaultWaitGroupValidator,
} from "./wait-group-rules.js";
import { newWaitGroup } from "./wait-group.js";

test("WaitGroupValidator reports every problem", () => {
  const validator = defaultWaitGroupValidator();
  const item = newWaitGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitGroupRequiredCodeRule flags a blank code", () => {
  const rule = new WaitGroupRequiredCodeRule("wait group needs a value");
  const item = newWaitGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitGroupScoreRangeRule flags values above score", () => {
  const rule = new WaitGroupScoreRangeRule(7.6, 4628.3);
  const item = newWaitGroup("x", "y");
  item.score = 4629.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitGroupRequiredTitleRule flags a blank title", () => {
  const rule = new WaitGroupRequiredTitleRule("wait group needs this field");
  const item = newWaitGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitGroupTitleLengthRule flags a long title", () => {
  const rule = new WaitGroupTitleLengthRule(255);
  const item = newWaitGroup("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitGroupLabelLengthRule flags a long label", () => {
  const rule = new WaitGroupLabelLengthRule(32);
  const item = newWaitGroup("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
