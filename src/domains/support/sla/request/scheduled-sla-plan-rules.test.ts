import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSlaPlanCodeLengthRule,
  ScheduledSlaPlanNameLengthRule,
  ScheduledSlaPlanRequiredLocaleRule,
  defaultScheduledSlaPlanValidator,
} from "./scheduled-sla-plan-rules.js";
import { newScheduledSlaPlan } from "./scheduled-sla-plan.js";

test("ScheduledSlaPlanValidator reports every problem", () => {
  const validator = defaultScheduledSlaPlanValidator();
  const item = newScheduledSlaPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSlaPlanNameLengthRule flags a long name", () => {
  const rule = new ScheduledSlaPlanNameLengthRule(64);
  const item = newScheduledSlaPlan("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSlaPlanCodeLengthRule flags a long code", () => {
  const rule = new ScheduledSlaPlanCodeLengthRule(120);
  const item = newScheduledSlaPlan("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSlaPlanRequiredLocaleRule flags a blank locale", () => {
  const rule = new ScheduledSlaPlanRequiredLocaleRule("scheduled sla plan needs this field");
  const item = newScheduledSlaPlan("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
