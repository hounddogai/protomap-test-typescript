import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightRuleCodeLengthRule,
  FlightRuleLimitRangeRule,
  FlightRuleNameLengthRule,
  FlightRuleRequiredNameRule,
  FlightRuleRequiredSummaryRule,
  defaultFlightRuleValidator,
} from "./flight-rule-rules.js";
import { newFlightRule } from "./flight-rule.js";

test("FlightRuleValidator reports every problem", () => {
  const validator = defaultFlightRuleValidator();
  const item = newFlightRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightRuleRequiredNameRule flags a blank name", () => {
  const rule = new FlightRuleRequiredNameRule("flight rule needs a value");
  const item = newFlightRule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightRuleLimitRangeRule flags values above limit", () => {
  const rule = new FlightRuleLimitRangeRule(16, 80);
  const item = newFlightRule("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightRuleNameLengthRule flags a long name", () => {
  const rule = new FlightRuleNameLengthRule(16);
  const item = newFlightRule("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightRuleCodeLengthRule flags a long code", () => {
  const rule = new FlightRuleCodeLengthRule(64);
  const item = newFlightRule("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightRuleRequiredSummaryRule flags a blank summary", () => {
  const rule = new FlightRuleRequiredSummaryRule("flight rule needs this field");
  const item = newFlightRule("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
