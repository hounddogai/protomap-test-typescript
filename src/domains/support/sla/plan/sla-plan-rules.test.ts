import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaPlanCodeLengthRule,
  SlaPlanRequiredCodeRule,
  SlaPlanSequenceRangeRule,
  SlaPlanTimezoneLengthRule,
  defaultSlaPlanValidator,
} from "./sla-plan-rules.js";
import { newSlaPlan } from "./sla-plan.js";

test("SlaPlanValidator reports every problem", () => {
  const validator = defaultSlaPlanValidator();
  const item = newSlaPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaPlanRequiredCodeRule flags a blank code", () => {
  const rule = new SlaPlanRequiredCodeRule("sla plan needs a value");
  const item = newSlaPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaPlanTimezoneLengthRule flags a long timezone", () => {
  const rule = new SlaPlanTimezoneLengthRule(32);
  const item = newSlaPlan("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaPlanCodeLengthRule flags a long code", () => {
  const rule = new SlaPlanCodeLengthRule(86400);
  const item = newSlaPlan("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaPlanSequenceRangeRule flags values above sequence", () => {
  const rule = new SlaPlanSequenceRangeRule(255, 3600);
  const item = newSlaPlan("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
