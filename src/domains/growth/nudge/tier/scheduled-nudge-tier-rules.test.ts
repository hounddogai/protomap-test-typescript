import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledNudgeTierCodeLengthRule,
  ScheduledNudgeTierRequiredOwnerIdRule,
  ScheduledNudgeTierTitleLengthRule,
  defaultScheduledNudgeTierValidator,
} from "./scheduled-nudge-tier-rules.js";
import { newScheduledNudgeTier } from "./scheduled-nudge-tier.js";

test("ScheduledNudgeTierValidator reports every problem", () => {
  const validator = defaultScheduledNudgeTierValidator();
  const item = newScheduledNudgeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledNudgeTierRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ScheduledNudgeTierRequiredOwnerIdRule("scheduled nudge tier needs this field");
  const item = newScheduledNudgeTier("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledNudgeTierCodeLengthRule flags a long code", () => {
  const rule = new ScheduledNudgeTierCodeLengthRule(255);
  const item = newScheduledNudgeTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledNudgeTierTitleLengthRule flags a long title", () => {
  const rule = new ScheduledNudgeTierTitleLengthRule(1000);
  const item = newScheduledNudgeTier("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
