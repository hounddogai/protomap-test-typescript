import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleReservationCodeLengthRule,
  ExitRuleReservationCostRangeRule,
  ExitRuleReservationImpressionsRangeRule,
  ExitRuleReservationRequiredChannelRule,
  ExitRuleReservationRequiredNameRule,
  ExitRuleReservationTimezoneLengthRule,
  defaultExitRuleReservationValidator,
} from "./exit-rule-reservation-rules.js";
import { newExitRuleReservation } from "./exit-rule-reservation.js";

test("ExitRuleReservationValidator reports every problem", () => {
  const validator = defaultExitRuleReservationValidator();
  const item = newExitRuleReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleReservationTimezoneLengthRule flags a long timezone", () => {
  const rule = new ExitRuleReservationTimezoneLengthRule(86400);
  const item = newExitRuleReservation("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleReservationCostRangeRule flags values above cost", () => {
  const rule = new ExitRuleReservationCostRangeRule(8.9, 3732.1);
  const item = newExitRuleReservation("x", "y");
  item.cost = 3733.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleReservationImpressionsRangeRule flags values above impressions", () => {
  const rule = new ExitRuleReservationImpressionsRangeRule(16, 86400);
  const item = newExitRuleReservation("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleReservationRequiredNameRule flags a blank name", () => {
  const rule = new ExitRuleReservationRequiredNameRule("exit rule reservation needs a value");
  const item = newExitRuleReservation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleReservationCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleReservationCodeLengthRule(80);
  const item = newExitRuleReservation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleReservationRequiredChannelRule flags a blank channel", () => {
  const rule = new ExitRuleReservationRequiredChannelRule("exit rule reservation needs an entry");
  const item = newExitRuleReservation("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
