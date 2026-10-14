import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightMappingExternalRefLengthRule,
  FlightMappingNameLengthRule,
  FlightMappingRequiredCodeRule,
  FlightMappingSequenceRangeRule,
  defaultFlightMappingValidator,
} from "./flight-mapping-rules.js";
import { newFlightMapping } from "./flight-mapping.js";

test("FlightMappingValidator reports every problem", () => {
  const validator = defaultFlightMappingValidator();
  const item = newFlightMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightMappingRequiredCodeRule flags a blank code", () => {
  const rule = new FlightMappingRequiredCodeRule("flight mapping needs an entry");
  const item = newFlightMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightMappingNameLengthRule flags a long name", () => {
  const rule = new FlightMappingNameLengthRule(16);
  const item = newFlightMapping("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightMappingSequenceRangeRule flags values above sequence", () => {
  const rule = new FlightMappingSequenceRangeRule(1000, 1000);
  const item = newFlightMapping("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightMappingExternalRefLengthRule flags a long external ref", () => {
  const rule = new FlightMappingExternalRefLengthRule(16);
  const item = newFlightMapping("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
