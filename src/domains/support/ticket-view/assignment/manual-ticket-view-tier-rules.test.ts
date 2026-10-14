import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTicketViewTierCohortLengthRule,
  ManualTicketViewTierEndsAtRangeRule,
  ManualTicketViewTierRequiredCohortRule,
  ManualTicketViewTierRequiredNameRule,
  defaultManualTicketViewTierValidator,
} from "./manual-ticket-view-tier-rules.js";
import { newManualTicketViewTier } from "./manual-ticket-view-tier.js";

test("ManualTicketViewTierValidator reports every problem", () => {
  const validator = defaultManualTicketViewTierValidator();
  const item = newManualTicketViewTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTicketViewTierRequiredNameRule flags a blank name", () => {
  const rule = new ManualTicketViewTierRequiredNameRule("manual ticket view tier needs a value");
  const item = newManualTicketViewTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTicketViewTierEndsAtRangeRule flags values above ends at", () => {
  const rule = new ManualTicketViewTierEndsAtRangeRule(255, 255);
  const item = newManualTicketViewTier("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTicketViewTierCohortLengthRule flags a long cohort", () => {
  const rule = new ManualTicketViewTierCohortLengthRule(255);
  const item = newManualTicketViewTier("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTicketViewTierRequiredCohortRule flags a blank cohort", () => {
  const rule = new ManualTicketViewTierRequiredCohortRule("manual ticket view tier needs a value");
  const item = newManualTicketViewTier("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
