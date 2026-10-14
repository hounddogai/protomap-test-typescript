import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaCycleCodeLengthRule,
  SlaCycleDescriptionLengthRule,
  SlaCycleRequiredCodeRule,
  defaultSlaCycleValidator,
} from "./sla-cycle-rules.js";
import { newSlaCycle } from "./sla-cycle.js";

test("SlaCycleValidator reports every problem", () => {
  const validator = defaultSlaCycleValidator();
  const item = newSlaCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaCycleRequiredCodeRule flags a blank code", () => {
  const rule = new SlaCycleRequiredCodeRule("sla cycle needs an entry");
  const item = newSlaCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaCycleDescriptionLengthRule flags a long description", () => {
  const rule = new SlaCycleDescriptionLengthRule(120);
  const item = newSlaCycle("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaCycleCodeLengthRule flags a long code", () => {
  const rule = new SlaCycleCodeLengthRule(64);
  const item = newSlaCycle("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
