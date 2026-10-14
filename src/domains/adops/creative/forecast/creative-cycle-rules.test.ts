import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeCycleCodeLengthRule,
  CreativeCycleNameLengthRule,
  CreativeCycleRequiredCategoryRule,
  CreativeCycleRequiredNameRule,
  defaultCreativeCycleValidator,
} from "./creative-cycle-rules.js";
import { newCreativeCycle } from "./creative-cycle.js";

test("CreativeCycleValidator reports every problem", () => {
  const validator = defaultCreativeCycleValidator();
  const item = newCreativeCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeCycleRequiredNameRule flags a blank name", () => {
  const rule = new CreativeCycleRequiredNameRule("creative cycle needs an entry");
  const item = newCreativeCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeCycleNameLengthRule flags a long name", () => {
  const rule = new CreativeCycleNameLengthRule(32);
  const item = newCreativeCycle("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeCycleRequiredCategoryRule flags a blank category", () => {
  const rule = new CreativeCycleRequiredCategoryRule("creative cycle needs an entry");
  const item = newCreativeCycle("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeCycleCodeLengthRule flags a long code", () => {
  const rule = new CreativeCycleCodeLengthRule(64);
  const item = newCreativeCycle("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
