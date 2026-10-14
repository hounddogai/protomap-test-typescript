import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalQueueReservationRequiredLabelRule,
  SeasonalQueueReservationScoreRangeRule,
  defaultSeasonalQueueReservationValidator,
} from "./seasonal-queue-reservation-rules.js";
import { newSeasonalQueueReservation } from "./seasonal-queue-reservation.js";

test("SeasonalQueueReservationValidator reports every problem", () => {
  const validator = defaultSeasonalQueueReservationValidator();
  const item = newSeasonalQueueReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalQueueReservationRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalQueueReservationRequiredLabelRule("seasonal queue reservation needs this field");
  const item = newSeasonalQueueReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalQueueReservationScoreRangeRule flags values above score", () => {
  const rule = new SeasonalQueueReservationScoreRangeRule(3.9, 1004.7);
  const item = newSeasonalQueueReservation("x", "y");
  item.score = 1006.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
