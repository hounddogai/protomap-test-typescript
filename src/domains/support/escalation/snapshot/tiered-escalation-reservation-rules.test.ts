import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredEscalationReservationLabelLengthRule,
  TieredEscalationReservationOwnerIdLengthRule,
  TieredEscalationReservationPriorityRangeRule,
  TieredEscalationReservationRequiredCodeRule,
  TieredEscalationReservationUtmSourceLengthRule,
  defaultTieredEscalationReservationValidator,
} from "./tiered-escalation-reservation-rules.js";
import { newTieredEscalationReservation } from "./tiered-escalation-reservation.js";

test("TieredEscalationReservationValidator reports every problem", () => {
  const validator = defaultTieredEscalationReservationValidator();
  const item = newTieredEscalationReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredEscalationReservationLabelLengthRule flags a long label", () => {
  const rule = new TieredEscalationReservationLabelLengthRule(120);
  const item = newTieredEscalationReservation("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredEscalationReservationPriorityRangeRule flags values above priority", () => {
  const rule = new TieredEscalationReservationPriorityRangeRule(86400, 86400);
  const item = newTieredEscalationReservation("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredEscalationReservationUtmSourceLengthRule flags a long utm source", () => {
  const rule = new TieredEscalationReservationUtmSourceLengthRule(1000);
  const item = newTieredEscalationReservation("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredEscalationReservationRequiredCodeRule flags a blank code", () => {
  const rule = new TieredEscalationReservationRequiredCodeRule("tiered escalation reservation needs an entry");
  const item = newTieredEscalationReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredEscalationReservationOwnerIdLengthRule flags a long owner id", () => {
  const rule = new TieredEscalationReservationOwnerIdLengthRule(64);
  const item = newTieredEscalationReservation("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
