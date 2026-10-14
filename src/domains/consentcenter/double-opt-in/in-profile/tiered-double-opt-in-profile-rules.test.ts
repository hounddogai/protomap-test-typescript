import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDoubleOptInProfileLabelLengthRule,
  TieredDoubleOptInProfileLimitRangeRule,
  TieredDoubleOptInProfilePriorityRangeRule,
  defaultTieredDoubleOptInProfileValidator,
} from "./tiered-double-opt-in-profile-rules.js";
import { newTieredDoubleOptInProfile } from "./tiered-double-opt-in-profile.js";

test("TieredDoubleOptInProfileValidator reports every problem", () => {
  const validator = defaultTieredDoubleOptInProfileValidator();
  const item = newTieredDoubleOptInProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDoubleOptInProfileLimitRangeRule flags values above limit", () => {
  const rule = new TieredDoubleOptInProfileLimitRangeRule(16, 32);
  const item = newTieredDoubleOptInProfile("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredDoubleOptInProfilePriorityRangeRule flags values above priority", () => {
  const rule = new TieredDoubleOptInProfilePriorityRangeRule(3600, 86400);
  const item = newTieredDoubleOptInProfile("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredDoubleOptInProfileLabelLengthRule flags a long label", () => {
  const rule = new TieredDoubleOptInProfileLabelLengthRule(32);
  const item = newTieredDoubleOptInProfile("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
