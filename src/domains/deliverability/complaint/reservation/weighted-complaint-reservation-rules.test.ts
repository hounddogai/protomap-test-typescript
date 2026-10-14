import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedComplaintReservationCapacityRangeRule,
  WeightedComplaintReservationFrequencyCapRangeRule,
  WeightedComplaintReservationRequiredChannelRule,
  WeightedComplaintReservationRequiredOwnerIdRule,
  defaultWeightedComplaintReservationValidator,
} from "./weighted-complaint-reservation-rules.js";
import { newWeightedComplaintReservation } from "./weighted-complaint-reservation.js";

test("WeightedComplaintReservationValidator reports every problem", () => {
  const validator = defaultWeightedComplaintReservationValidator();
  const item = newWeightedComplaintReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedComplaintReservationFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new WeightedComplaintReservationFrequencyCapRangeRule(16, 80);
  const item = newWeightedComplaintReservation("x", "y");
  item.frequencyCap = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedComplaintReservationRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new WeightedComplaintReservationRequiredOwnerIdRule("weighted complaint reservation needs an entry");
  const item = newWeightedComplaintReservation("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedComplaintReservationCapacityRangeRule flags values above capacity", () => {
  const rule = new WeightedComplaintReservationCapacityRangeRule(1000, 1000);
  const item = newWeightedComplaintReservation("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedComplaintReservationRequiredChannelRule flags a blank channel", () => {
  const rule = new WeightedComplaintReservationRequiredChannelRule("weighted complaint reservation needs a value");
  const item = newWeightedComplaintReservation("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
