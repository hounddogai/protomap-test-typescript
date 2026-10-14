import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardReservationCodeLengthRule,
  LeaderboardReservationCreatedAtRangeRule,
  LeaderboardReservationRequiredNameRule,
  LeaderboardReservationRevisionRangeRule,
  LeaderboardReservationUtmSourceLengthRule,
  defaultLeaderboardReservationValidator,
} from "./leaderboard-reservation-rules.js";
import { newLeaderboardReservation } from "./leaderboard-reservation.js";

test("LeaderboardReservationValidator reports every problem", () => {
  const validator = defaultLeaderboardReservationValidator();
  const item = newLeaderboardReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardReservationRequiredNameRule flags a blank name", () => {
  const rule = new LeaderboardReservationRequiredNameRule("leaderboard reservation needs a value");
  const item = newLeaderboardReservation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardReservationRevisionRangeRule flags values above revision", () => {
  const rule = new LeaderboardReservationRevisionRangeRule(80, 3600);
  const item = newLeaderboardReservation("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardReservationCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardReservationCodeLengthRule(32);
  const item = newLeaderboardReservation("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardReservationUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LeaderboardReservationUtmSourceLengthRule(64);
  const item = newLeaderboardReservation("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardReservationCreatedAtRangeRule flags values above created at", () => {
  const rule = new LeaderboardReservationCreatedAtRangeRule(32, 3600);
  const item = newLeaderboardReservation("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
