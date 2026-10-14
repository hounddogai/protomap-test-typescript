import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalChallengeCycleRateRangeRule,
  GlobalChallengeCycleRequiredCodeRule,
  GlobalChallengeCycleRequiredNameRule,
  GlobalChallengeCycleTitleLengthRule,
  defaultGlobalChallengeCycleValidator,
} from "./global-challenge-cycle-rules.js";
import { newGlobalChallengeCycle } from "./global-challenge-cycle.js";

test("GlobalChallengeCycleValidator reports every problem", () => {
  const validator = defaultGlobalChallengeCycleValidator();
  const item = newGlobalChallengeCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalChallengeCycleTitleLengthRule flags a long title", () => {
  const rule = new GlobalChallengeCycleTitleLengthRule(1000);
  const item = newGlobalChallengeCycle("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalChallengeCycleRequiredNameRule flags a blank name", () => {
  const rule = new GlobalChallengeCycleRequiredNameRule("global challenge cycle needs a value");
  const item = newGlobalChallengeCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalChallengeCycleRateRangeRule flags values above rate", () => {
  const rule = new GlobalChallengeCycleRateRangeRule(0.9, 4959.9);
  const item = newGlobalChallengeCycle("x", "y");
  item.rate = 4961.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalChallengeCycleRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalChallengeCycleRequiredCodeRule("global challenge cycle needs this field");
  const item = newGlobalChallengeCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
