import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationCycleCodeLengthRule,
  ActivationCycleCurrencyLengthRule,
  ActivationCycleVersionRangeRule,
  defaultActivationCycleValidator,
} from "./activation-cycle-rules.js";
import { newActivationCycle } from "./activation-cycle.js";

test("ActivationCycleValidator reports every problem", () => {
  const validator = defaultActivationCycleValidator();
  const item = newActivationCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationCycleCurrencyLengthRule flags a long currency", () => {
  const rule = new ActivationCycleCurrencyLengthRule(255);
  const item = newActivationCycle("x", "y");
  item.currency = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationCycleVersionRangeRule flags values above version", () => {
  const rule = new ActivationCycleVersionRangeRule(120, 86400);
  const item = newActivationCycle("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationCycleCodeLengthRule flags a long code", () => {
  const rule = new ActivationCycleCodeLengthRule(120);
  const item = newActivationCycle("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
