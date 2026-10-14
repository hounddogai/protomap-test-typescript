import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyProofClaimAudienceIdLengthRule,
  defaultLegacyProofClaimValidator,
} from "./legacy-proof-claim-rules.js";
import { newLegacyProofClaim } from "./legacy-proof-claim.js";

test("LegacyProofClaimValidator reports every problem", () => {
  const validator = defaultLegacyProofClaimValidator();
  const item = newLegacyProofClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyProofClaimAudienceIdLengthRule flags a long audience id", () => {
  const rule = new LegacyProofClaimAudienceIdLengthRule(3600);
  const item = newLegacyProofClaim("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
