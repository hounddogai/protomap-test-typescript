import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPlacementReservationCodeLengthRule,
  TieredPlacementReservationRequiredCampaignRefRule,
  defaultTieredPlacementReservationValidator,
} from "./tiered-placement-reservation-rules.js";
import { newTieredPlacementReservation } from "./tiered-placement-reservation.js";

test("TieredPlacementReservationValidator reports every problem", () => {
  const validator = defaultTieredPlacementReservationValidator();
  const item = newTieredPlacementReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPlacementReservationRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new TieredPlacementReservationRequiredCampaignRefRule("tiered placement reservation needs a value");
  const item = newTieredPlacementReservation("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPlacementReservationCodeLengthRule flags a long code", () => {
  const rule = new TieredPlacementReservationCodeLengthRule(16);
  const item = newTieredPlacementReservation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
