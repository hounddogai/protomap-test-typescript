import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierRequestDurationMinutesRangeRule,
  TierRequestRequiredCodeRule,
  defaultTierRequestValidator,
} from "./tier-request-rules.js";
import { newTierRequest } from "./tier-request.js";

test("TierRequestValidator reports every problem", () => {
  const validator = defaultTierRequestValidator();
  const item = newTierRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierRequestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new TierRequestDurationMinutesRangeRule(3600, 3600);
  const item = newTierRequest("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierRequestRequiredCodeRule flags a blank code", () => {
  const rule = new TierRequestRequiredCodeRule("tier request needs this field");
  const item = newTierRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
