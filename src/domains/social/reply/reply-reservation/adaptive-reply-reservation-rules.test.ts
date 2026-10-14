import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveReplyReservationRequiredTitleRule,
  AdaptiveReplyReservationTitleLengthRule,
  defaultAdaptiveReplyReservationValidator,
} from "./adaptive-reply-reservation-rules.js";
import { newAdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

test("AdaptiveReplyReservationValidator reports every problem", () => {
  const validator = defaultAdaptiveReplyReservationValidator();
  const item = newAdaptiveReplyReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveReplyReservationRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveReplyReservationRequiredTitleRule("adaptive reply reservation needs this field");
  const item = newAdaptiveReplyReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveReplyReservationTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveReplyReservationTitleLengthRule(3600);
  const item = newAdaptiveReplyReservation("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
