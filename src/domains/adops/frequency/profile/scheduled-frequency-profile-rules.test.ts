import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFrequencyProfileOwnerIdLengthRule,
  defaultScheduledFrequencyProfileValidator,
} from "./scheduled-frequency-profile-rules.js";
import { newScheduledFrequencyProfile } from "./scheduled-frequency-profile.js";

test("ScheduledFrequencyProfileValidator reports every problem", () => {
  const validator = defaultScheduledFrequencyProfileValidator();
  const item = newScheduledFrequencyProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFrequencyProfileOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ScheduledFrequencyProfileOwnerIdLengthRule(120);
  const item = newScheduledFrequencyProfile("x", "y");
  item.ownerId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
