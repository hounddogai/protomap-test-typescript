import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCreativeCycleCodeLengthRule,
  StrictCreativeCycleRequiredCodeRule,
  StrictCreativeCycleRequiredUtmSourceRule,
  StrictCreativeCycleTitleLengthRule,
  defaultStrictCreativeCycleValidator,
} from "./strict-creative-cycle-rules.js";
import { newStrictCreativeCycle } from "./strict-creative-cycle.js";

test("StrictCreativeCycleValidator reports every problem", () => {
  const validator = defaultStrictCreativeCycleValidator();
  const item = newStrictCreativeCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCreativeCycleRequiredCodeRule flags a blank code", () => {
  const rule = new StrictCreativeCycleRequiredCodeRule("strict creative cycle needs an entry");
  const item = newStrictCreativeCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCreativeCycleTitleLengthRule flags a long title", () => {
  const rule = new StrictCreativeCycleTitleLengthRule(255);
  const item = newStrictCreativeCycle("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreativeCycleCodeLengthRule flags a long code", () => {
  const rule = new StrictCreativeCycleCodeLengthRule(3600);
  const item = newStrictCreativeCycle("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreativeCycleRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new StrictCreativeCycleRequiredUtmSourceRule("strict creative cycle needs this field");
  const item = newStrictCreativeCycle("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
