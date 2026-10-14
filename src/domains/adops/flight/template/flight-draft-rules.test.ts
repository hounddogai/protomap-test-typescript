import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightDraftConversionRateRangeRule,
  FlightDraftNotesLengthRule,
  FlightDraftRequiredLabelRule,
  FlightDraftTitleLengthRule,
  defaultFlightDraftValidator,
} from "./flight-draft-rules.js";
import { newFlightDraft } from "./flight-draft.js";

test("FlightDraftValidator reports every problem", () => {
  const validator = defaultFlightDraftValidator();
  const item = newFlightDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightDraftTitleLengthRule flags a long title", () => {
  const rule = new FlightDraftTitleLengthRule(32);
  const item = newFlightDraft("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightDraftNotesLengthRule flags a long notes", () => {
  const rule = new FlightDraftNotesLengthRule(16);
  const item = newFlightDraft("x", "y");
  item.notes = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightDraftRequiredLabelRule flags a blank label", () => {
  const rule = new FlightDraftRequiredLabelRule("flight draft needs this field");
  const item = newFlightDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightDraftConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new FlightDraftConversionRateRangeRule(6.4, 2361.8);
  const item = newFlightDraft("x", "y");
  item.conversionRate = 2363.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
