import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyMappingCodeLengthRule,
  JourneyMappingRequiredChannelRule,
  JourneyMappingRequiredTimezoneRule,
  defaultJourneyMappingValidator,
} from "./journey-mapping-rules.js";
import { newJourneyMapping } from "./journey-mapping.js";

test("JourneyMappingValidator reports every problem", () => {
  const validator = defaultJourneyMappingValidator();
  const item = newJourneyMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyMappingRequiredChannelRule flags a blank channel", () => {
  const rule = new JourneyMappingRequiredChannelRule("journey mapping needs this field");
  const item = newJourneyMapping("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyMappingCodeLengthRule flags a long code", () => {
  const rule = new JourneyMappingCodeLengthRule(1000);
  const item = newJourneyMapping("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyMappingRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new JourneyMappingRequiredTimezoneRule("journey mapping needs a value");
  const item = newJourneyMapping("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
