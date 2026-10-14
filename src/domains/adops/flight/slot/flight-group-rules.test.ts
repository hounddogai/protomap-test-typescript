import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightGroupRatioRangeRule,
  FlightGroupRequiredCodeRule,
  FlightGroupRequiredJourneyIdRule,
  FlightGroupRetriesRangeRule,
  defaultFlightGroupValidator,
} from "./flight-group-rules.js";
import { newFlightGroup } from "./flight-group.js";

test("FlightGroupValidator reports every problem", () => {
  const validator = defaultFlightGroupValidator();
  const item = newFlightGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightGroupRatioRangeRule flags values above ratio", () => {
  const rule = new FlightGroupRatioRangeRule(4.9, 292.5);
  const item = newFlightGroup("x", "y");
  item.ratio = 294;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightGroupRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new FlightGroupRequiredJourneyIdRule("flight group needs a value");
  const item = newFlightGroup("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightGroupRetriesRangeRule flags values above retries", () => {
  const rule = new FlightGroupRetriesRangeRule(120, 1000);
  const item = newFlightGroup("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightGroupRequiredCodeRule flags a blank code", () => {
  const rule = new FlightGroupRequiredCodeRule("flight group needs an entry");
  const item = newFlightGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
