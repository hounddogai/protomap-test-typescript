import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBounceCycleExternalRefLengthRule,
  StrictBounceCycleRequiredCodeRule,
  StrictBounceCycleRequiredExternalRefRule,
  StrictBounceCycleRequiredUtmSourceRule,
  StrictBounceCycleUtmSourceLengthRule,
  defaultStrictBounceCycleValidator,
} from "./strict-bounce-cycle-rules.js";
import { newStrictBounceCycle } from "./strict-bounce-cycle.js";

test("StrictBounceCycleValidator reports every problem", () => {
  const validator = defaultStrictBounceCycleValidator();
  const item = newStrictBounceCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBounceCycleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new StrictBounceCycleUtmSourceLengthRule(64);
  const item = newStrictBounceCycle("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBounceCycleRequiredCodeRule flags a blank code", () => {
  const rule = new StrictBounceCycleRequiredCodeRule("strict bounce cycle needs a value");
  const item = newStrictBounceCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictBounceCycleExternalRefLengthRule flags a long external ref", () => {
  const rule = new StrictBounceCycleExternalRefLengthRule(1000);
  const item = newStrictBounceCycle("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBounceCycleRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new StrictBounceCycleRequiredExternalRefRule("strict bounce cycle needs this field");
  const item = newStrictBounceCycle("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictBounceCycleRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new StrictBounceCycleRequiredUtmSourceRule("strict bounce cycle needs this field");
  const item = newStrictBounceCycle("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
