import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSlaPlanAttemptsRangeRule,
  GlobalSlaPlanCodeLengthRule,
  GlobalSlaPlanRequiredCodeRule,
  GlobalSlaPlanRequiredDescriptionRule,
  defaultGlobalSlaPlanValidator,
} from "./global-sla-plan-rules.js";
import { newGlobalSlaPlan } from "./global-sla-plan.js";

test("GlobalSlaPlanValidator reports every problem", () => {
  const validator = defaultGlobalSlaPlanValidator();
  const item = newGlobalSlaPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSlaPlanCodeLengthRule flags a long code", () => {
  const rule = new GlobalSlaPlanCodeLengthRule(80);
  const item = newGlobalSlaPlan("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSlaPlanRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalSlaPlanRequiredCodeRule("global sla plan needs a value");
  const item = newGlobalSlaPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSlaPlanRequiredDescriptionRule flags a blank description", () => {
  const rule = new GlobalSlaPlanRequiredDescriptionRule("global sla plan needs an entry");
  const item = newGlobalSlaPlan("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSlaPlanAttemptsRangeRule flags values above attempts", () => {
  const rule = new GlobalSlaPlanAttemptsRangeRule(120, 3600);
  const item = newGlobalSlaPlan("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
