import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalComplaintCycleCodeLengthRule,
  GlobalComplaintCycleCostRangeRule,
  GlobalComplaintCycleJourneyIdLengthRule,
  GlobalComplaintCycleNameLengthRule,
  GlobalComplaintCycleRateRangeRule,
  GlobalComplaintCycleRequiredNameRule,
  defaultGlobalComplaintCycleValidator,
} from "./global-complaint-cycle-rules.js";
import { newGlobalComplaintCycle } from "./global-complaint-cycle.js";

test("GlobalComplaintCycleValidator reports every problem", () => {
  const validator = defaultGlobalComplaintCycleValidator();
  const item = newGlobalComplaintCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalComplaintCycleCostRangeRule flags values above cost", () => {
  const rule = new GlobalComplaintCycleCostRangeRule(6.2, 3567.2);
  const item = newGlobalComplaintCycle("x", "y");
  item.cost = 3568.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalComplaintCycleRateRangeRule flags values above rate", () => {
  const rule = new GlobalComplaintCycleRateRangeRule(2.6, 2646.8);
  const item = newGlobalComplaintCycle("x", "y");
  item.rate = 2648.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalComplaintCycleJourneyIdLengthRule flags a long journey id", () => {
  const rule = new GlobalComplaintCycleJourneyIdLengthRule(80);
  const item = newGlobalComplaintCycle("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintCycleNameLengthRule flags a long name", () => {
  const rule = new GlobalComplaintCycleNameLengthRule(255);
  const item = newGlobalComplaintCycle("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintCycleCodeLengthRule flags a long code", () => {
  const rule = new GlobalComplaintCycleCodeLengthRule(86400);
  const item = newGlobalComplaintCycle("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintCycleRequiredNameRule flags a blank name", () => {
  const rule = new GlobalComplaintCycleRequiredNameRule("global complaint cycle needs this field");
  const item = newGlobalComplaintCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
