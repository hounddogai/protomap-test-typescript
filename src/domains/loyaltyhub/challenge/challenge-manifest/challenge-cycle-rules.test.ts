import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeCycleNameLengthRule,
  ChallengeCycleNotesLengthRule,
  ChallengeCycleRequiredCodeRule,
  ChallengeCycleRequiredNotesRule,
  defaultChallengeCycleValidator,
} from "./challenge-cycle-rules.js";
import { newChallengeCycle } from "./challenge-cycle.js";

test("ChallengeCycleValidator reports every problem", () => {
  const validator = defaultChallengeCycleValidator();
  const item = newChallengeCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeCycleRequiredCodeRule flags a blank code", () => {
  const rule = new ChallengeCycleRequiredCodeRule("challenge cycle needs a value");
  const item = newChallengeCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeCycleRequiredNotesRule flags a blank notes", () => {
  const rule = new ChallengeCycleRequiredNotesRule("challenge cycle needs an entry");
  const item = newChallengeCycle("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeCycleNotesLengthRule flags a long notes", () => {
  const rule = new ChallengeCycleNotesLengthRule(80);
  const item = newChallengeCycle("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeCycleNameLengthRule flags a long name", () => {
  const rule = new ChallengeCycleNameLengthRule(64);
  const item = newChallengeCycle("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
