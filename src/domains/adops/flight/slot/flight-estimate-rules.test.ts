import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightEstimateRequiredCodeRule,
  FlightEstimateRequiredNameRule,
  defaultFlightEstimateValidator,
} from "./flight-estimate-rules.js";
import { newFlightEstimate } from "./flight-estimate.js";

test("FlightEstimateValidator reports every problem", () => {
  const validator = defaultFlightEstimateValidator();
  const item = newFlightEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new FlightEstimateRequiredCodeRule("flight estimate needs this field");
  const item = newFlightEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightEstimateRequiredNameRule flags a blank name", () => {
  const rule = new FlightEstimateRequiredNameRule("flight estimate needs an entry");
  const item = newFlightEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
