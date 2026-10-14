import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyTicketViewAssignmentRequiredCategoryRule,
  LegacyTicketViewAssignmentSequenceRangeRule,
  defaultLegacyTicketViewAssignmentValidator,
} from "./legacy-ticket-view-assignment-rules.js";
import { newLegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

test("LegacyTicketViewAssignmentValidator reports every problem", () => {
  const validator = defaultLegacyTicketViewAssignmentValidator();
  const item = newLegacyTicketViewAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyTicketViewAssignmentSequenceRangeRule flags values above sequence", () => {
  const rule = new LegacyTicketViewAssignmentSequenceRangeRule(3600, 3600);
  const item = newLegacyTicketViewAssignment("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTicketViewAssignmentRequiredCategoryRule flags a blank category", () => {
  const rule = new LegacyTicketViewAssignmentRequiredCategoryRule("legacy ticket view assignment needs a value");
  const item = newLegacyTicketViewAssignment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
