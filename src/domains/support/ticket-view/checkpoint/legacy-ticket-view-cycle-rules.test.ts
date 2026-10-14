import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyTicketViewCycleCodeLengthRule,
  LegacyTicketViewCycleEndsAtRangeRule,
  LegacyTicketViewCycleNotesLengthRule,
  defaultLegacyTicketViewCycleValidator,
} from "./legacy-ticket-view-cycle-rules.js";
import { newLegacyTicketViewCycle } from "./legacy-ticket-view-cycle.js";

test("LegacyTicketViewCycleValidator reports every problem", () => {
  const validator = defaultLegacyTicketViewCycleValidator();
  const item = newLegacyTicketViewCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyTicketViewCycleNotesLengthRule flags a long notes", () => {
  const rule = new LegacyTicketViewCycleNotesLengthRule(1000);
  const item = newLegacyTicketViewCycle("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyTicketViewCycleEndsAtRangeRule flags values above ends at", () => {
  const rule = new LegacyTicketViewCycleEndsAtRangeRule(3600, 86400);
  const item = newLegacyTicketViewCycle("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTicketViewCycleCodeLengthRule flags a long code", () => {
  const rule = new LegacyTicketViewCycleCodeLengthRule(16);
  const item = newLegacyTicketViewCycle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
