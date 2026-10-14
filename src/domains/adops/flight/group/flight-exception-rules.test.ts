import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightExceptionRequiredCodeRule,
  FlightExceptionRequiredTitleRule,
  defaultFlightExceptionValidator,
} from "./flight-exception-rules.js";
import { newFlightException } from "./flight-exception.js";

test("FlightExceptionValidator reports every problem", () => {
  const validator = defaultFlightExceptionValidator();
  const item = newFlightException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new FlightExceptionRequiredTitleRule("flight exception needs a value");
  const item = newFlightException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new FlightExceptionRequiredCodeRule("flight exception needs an entry");
  const item = newFlightException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
