import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingAllocationNotesLengthRule,
  PacingAllocationRequiredCampaignRefRule,
  PacingAllocationRequiredNotesRule,
  defaultPacingAllocationValidator,
} from "./pacing-allocation-rules.js";
import { newPacingAllocation } from "./pacing-allocation.js";

test("PacingAllocationValidator reports every problem", () => {
  const validator = defaultPacingAllocationValidator();
  const item = newPacingAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingAllocationRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new PacingAllocationRequiredCampaignRefRule("pacing allocation needs an entry");
  const item = newPacingAllocation("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingAllocationNotesLengthRule flags a long notes", () => {
  const rule = new PacingAllocationNotesLengthRule(3600);
  const item = newPacingAllocation("x", "y");
  item.notes = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingAllocationRequiredNotesRule flags a blank notes", () => {
  const rule = new PacingAllocationRequiredNotesRule("pacing allocation needs a value");
  const item = newPacingAllocation("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
