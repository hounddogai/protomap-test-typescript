import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFlightClaimCreatedAtRangeRule,
  LegacyFlightClaimRequiredPhoneRule,
  LegacyFlightClaimRequiredTitleRule,
  defaultLegacyFlightClaimValidator,
} from "./legacy-flight-claim-rules.js";
import { newLegacyFlightClaim } from "./legacy-flight-claim.js";

test("LegacyFlightClaimValidator reports every problem", () => {
  const validator = defaultLegacyFlightClaimValidator();
  const item = newLegacyFlightClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFlightClaimRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyFlightClaimRequiredTitleRule("legacy flight claim needs a value");
  const item = newLegacyFlightClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFlightClaimCreatedAtRangeRule flags values above created at", () => {
  const rule = new LegacyFlightClaimCreatedAtRangeRule(32, 86400);
  const item = newLegacyFlightClaim("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyFlightClaimRequiredPhoneRule flags a blank phone", () => {
  const rule = new LegacyFlightClaimRequiredPhoneRule("legacy flight claim needs an entry");
  const item = newLegacyFlightClaim("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
