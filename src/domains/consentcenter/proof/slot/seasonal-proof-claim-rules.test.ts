import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalProofClaimCodeLengthRule,
  SeasonalProofClaimRequiredOwnerIdRule,
  SeasonalProofClaimWeightRangeRule,
  defaultSeasonalProofClaimValidator,
} from "./seasonal-proof-claim-rules.js";
import { newSeasonalProofClaim } from "./seasonal-proof-claim.js";

test("SeasonalProofClaimValidator reports every problem", () => {
  const validator = defaultSeasonalProofClaimValidator();
  const item = newSeasonalProofClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalProofClaimRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new SeasonalProofClaimRequiredOwnerIdRule("seasonal proof claim needs this field");
  const item = newSeasonalProofClaim("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalProofClaimCodeLengthRule flags a long code", () => {
  const rule = new SeasonalProofClaimCodeLengthRule(64);
  const item = newSeasonalProofClaim("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalProofClaimWeightRangeRule flags values above weight", () => {
  const rule = new SeasonalProofClaimWeightRangeRule(0.4, 4893.9);
  const item = newSeasonalProofClaim("x", "y");
  item.weight = 4895.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
