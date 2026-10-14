import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementClaimExpiresAtRangeRule,
  PlacementClaimSequenceRangeRule,
  PlacementClaimSummaryLengthRule,
  PlacementClaimTitleLengthRule,
  defaultPlacementClaimValidator,
} from "./placement-claim-rules.js";
import { newPlacementClaim } from "./placement-claim.js";

test("PlacementClaimValidator reports every problem", () => {
  const validator = defaultPlacementClaimValidator();
  const item = newPlacementClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementClaimExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PlacementClaimExpiresAtRangeRule(120, 1000);
  const item = newPlacementClaim("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementClaimSequenceRangeRule flags values above sequence", () => {
  const rule = new PlacementClaimSequenceRangeRule(32, 1000);
  const item = newPlacementClaim("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementClaimTitleLengthRule flags a long title", () => {
  const rule = new PlacementClaimTitleLengthRule(64);
  const item = newPlacementClaim("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementClaimSummaryLengthRule flags a long summary", () => {
  const rule = new PlacementClaimSummaryLengthRule(120);
  const item = newPlacementClaim("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
