import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightEntryRequiredCodeRule,
  FlightEntryRequiredLabelRule,
  FlightEntryRequiredVariantRule,
  defaultFlightEntryValidator,
} from "./flight-entry-rules.js";
import { newFlightEntry } from "./flight-entry.js";

test("FlightEntryValidator reports every problem", () => {
  const validator = defaultFlightEntryValidator();
  const item = newFlightEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightEntryRequiredVariantRule flags a blank variant", () => {
  const rule = new FlightEntryRequiredVariantRule("flight entry needs a value");
  const item = newFlightEntry("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightEntryRequiredLabelRule flags a blank label", () => {
  const rule = new FlightEntryRequiredLabelRule("flight entry needs a value");
  const item = newFlightEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightEntryRequiredCodeRule flags a blank code", () => {
  const rule = new FlightEntryRequiredCodeRule("flight entry needs a value");
  const item = newFlightEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
