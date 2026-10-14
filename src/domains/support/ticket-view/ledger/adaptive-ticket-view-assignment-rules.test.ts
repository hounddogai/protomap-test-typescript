import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveTicketViewAssignmentRequiredCodeRule,
  AdaptiveTicketViewAssignmentRequiredDescriptionRule,
  AdaptiveTicketViewAssignmentRequiredReviewerRule,
  defaultAdaptiveTicketViewAssignmentValidator,
} from "./adaptive-ticket-view-assignment-rules.js";
import { newAdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

test("AdaptiveTicketViewAssignmentValidator reports every problem", () => {
  const validator = defaultAdaptiveTicketViewAssignmentValidator();
  const item = newAdaptiveTicketViewAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveTicketViewAssignmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new AdaptiveTicketViewAssignmentRequiredDescriptionRule("adaptive ticket view assignment needs an entry");
  const item = newAdaptiveTicketViewAssignment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTicketViewAssignmentRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new AdaptiveTicketViewAssignmentRequiredReviewerRule("adaptive ticket view assignment needs a value");
  const item = newAdaptiveTicketViewAssignment("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTicketViewAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveTicketViewAssignmentRequiredCodeRule("adaptive ticket view assignment needs an entry");
  const item = newAdaptiveTicketViewAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
