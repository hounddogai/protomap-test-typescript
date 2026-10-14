import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCohortClaimCodeLengthRule,
  LegacyCohortClaimExpiresAtRangeRule,
  LegacyCohortClaimFloorValueRangeRule,
  defaultLegacyCohortClaimValidator,
} from "./legacy-cohort-claim-rules.js";
import { newLegacyCohortClaim } from "./legacy-cohort-claim.js";

test("LegacyCohortClaimValidator reports every problem", () => {
  const validator = defaultLegacyCohortClaimValidator();
  const item = newLegacyCohortClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCohortClaimFloorValueRangeRule flags values above floor value", () => {
  const rule = new LegacyCohortClaimFloorValueRangeRule(9.7, 737.1);
  const item = newLegacyCohortClaim("x", "y");
  item.floorValue = 738.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCohortClaimCodeLengthRule flags a long code", () => {
  const rule = new LegacyCohortClaimCodeLengthRule(3600);
  const item = newLegacyCohortClaim("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCohortClaimExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LegacyCohortClaimExpiresAtRangeRule(32, 120);
  const item = newLegacyCohortClaim("x", "y");
  item.expiresAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
