import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryReputationClaimRequiredTitleRule,
  PrimaryReputationClaimStartsAtRangeRule,
  PrimaryReputationClaimUpdatedAtRangeRule,
  defaultPrimaryReputationClaimValidator,
} from "./primary-reputation-claim-rules.js";
import { newPrimaryReputationClaim } from "./primary-reputation-claim.js";

test("PrimaryReputationClaimValidator reports every problem", () => {
  const validator = defaultPrimaryReputationClaimValidator();
  const item = newPrimaryReputationClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryReputationClaimRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryReputationClaimRequiredTitleRule("primary reputation claim needs a value");
  const item = newPrimaryReputationClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryReputationClaimUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PrimaryReputationClaimUpdatedAtRangeRule(1000, 3600);
  const item = newPrimaryReputationClaim("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryReputationClaimStartsAtRangeRule flags values above starts at", () => {
  const rule = new PrimaryReputationClaimStartsAtRangeRule(32, 1000);
  const item = newPrimaryReputationClaim("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
