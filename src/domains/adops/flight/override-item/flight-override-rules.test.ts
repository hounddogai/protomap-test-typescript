import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightOverrideCodeLengthRule,
  FlightOverrideRequiredCodeRule,
  FlightOverrideRequiredTitleRule,
  FlightOverrideTitleLengthRule,
  defaultFlightOverrideValidator,
} from "./flight-override-rules.js";
import { newFlightOverride } from "./flight-override.js";

test("FlightOverrideValidator reports every problem", () => {
  const validator = defaultFlightOverrideValidator();
  const item = newFlightOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new FlightOverrideRequiredTitleRule("flight override needs a value");
  const item = newFlightOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightOverrideCodeLengthRule flags a long code", () => {
  const rule = new FlightOverrideCodeLengthRule(86400);
  const item = newFlightOverride("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightOverrideTitleLengthRule flags a long title", () => {
  const rule = new FlightOverrideTitleLengthRule(255);
  const item = newFlightOverride("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new FlightOverrideRequiredCodeRule("flight override needs an entry");
  const item = newFlightOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
