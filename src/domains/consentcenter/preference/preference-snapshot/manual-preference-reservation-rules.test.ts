import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPreferenceReservationCampaignRefLengthRule,
  ManualPreferenceReservationMinimumRangeRule,
  defaultManualPreferenceReservationValidator,
} from "./manual-preference-reservation-rules.js";
import { newManualPreferenceReservation } from "./manual-preference-reservation.js";

test("ManualPreferenceReservationValidator reports every problem", () => {
  const validator = defaultManualPreferenceReservationValidator();
  const item = newManualPreferenceReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPreferenceReservationCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ManualPreferenceReservationCampaignRefLengthRule(80);
  const item = newManualPreferenceReservation("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPreferenceReservationMinimumRangeRule flags values above minimum", () => {
  const rule = new ManualPreferenceReservationMinimumRangeRule(1, 2511.3);
  const item = newManualPreferenceReservation("x", "y");
  item.minimum = 2512.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
