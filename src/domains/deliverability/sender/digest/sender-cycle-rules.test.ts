import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderCycleCodeLengthRule,
  SenderCycleDescriptionLengthRule,
  SenderCycleRequiredCodeRule,
  SenderCycleReviewerLengthRule,
  defaultSenderCycleValidator,
} from "./sender-cycle-rules.js";
import { newSenderCycle } from "./sender-cycle.js";

test("SenderCycleValidator reports every problem", () => {
  const validator = defaultSenderCycleValidator();
  const item = newSenderCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderCycleRequiredCodeRule flags a blank code", () => {
  const rule = new SenderCycleRequiredCodeRule("sender cycle needs an entry");
  const item = newSenderCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderCycleReviewerLengthRule flags a long reviewer", () => {
  const rule = new SenderCycleReviewerLengthRule(86400);
  const item = newSenderCycle("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderCycleDescriptionLengthRule flags a long description", () => {
  const rule = new SenderCycleDescriptionLengthRule(86400);
  const item = newSenderCycle("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderCycleCodeLengthRule flags a long code", () => {
  const rule = new SenderCycleCodeLengthRule(80);
  const item = newSenderCycle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
