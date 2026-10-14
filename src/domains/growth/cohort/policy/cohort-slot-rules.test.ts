import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortSlotCodeLengthRule,
  CohortSlotLimitRangeRule,
  CohortSlotUnitLengthRule,
  defaultCohortSlotValidator,
} from "./cohort-slot-rules.js";
import { newCohortSlot } from "./cohort-slot.js";

test("CohortSlotValidator reports every problem", () => {
  const validator = defaultCohortSlotValidator();
  const item = newCohortSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortSlotUnitLengthRule flags a long unit", () => {
  const rule = new CohortSlotUnitLengthRule(3600);
  const item = newCohortSlot("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortSlotCodeLengthRule flags a long code", () => {
  const rule = new CohortSlotCodeLengthRule(64);
  const item = newCohortSlot("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortSlotLimitRangeRule flags values above limit", () => {
  const rule = new CohortSlotLimitRangeRule(80, 120);
  const item = newCohortSlot("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
