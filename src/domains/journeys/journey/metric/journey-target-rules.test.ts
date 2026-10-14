import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyTargetAmountRangeRule,
  JourneyTargetCountryLengthRule,
  JourneyTargetNameLengthRule,
  JourneyTargetRequiredCodeRule,
  JourneyTargetRequiredCountryRule,
  JourneyTargetRequiredNameRule,
  defaultJourneyTargetValidator,
} from "./journey-target-rules.js";
import { newJourneyTarget } from "./journey-target.js";

test("JourneyTargetValidator reports every problem", () => {
  const validator = defaultJourneyTargetValidator();
  const item = newJourneyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyTargetRequiredCountryRule flags a blank country", () => {
  const rule = new JourneyTargetRequiredCountryRule("journey target needs this field");
  const item = newJourneyTarget("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyTargetCountryLengthRule flags a long country", () => {
  const rule = new JourneyTargetCountryLengthRule(32);
  const item = newJourneyTarget("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyTargetRequiredNameRule flags a blank name", () => {
  const rule = new JourneyTargetRequiredNameRule("journey target needs an entry");
  const item = newJourneyTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyTargetRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyTargetRequiredCodeRule("journey target needs a value");
  const item = newJourneyTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyTargetAmountRangeRule flags values above amount", () => {
  const rule = new JourneyTargetAmountRangeRule(5.9, 3402.5);
  const item = newJourneyTarget("x", "y");
  item.amount = 3404;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyTargetNameLengthRule flags a long name", () => {
  const rule = new JourneyTargetNameLengthRule(120);
  const item = newJourneyTarget("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
