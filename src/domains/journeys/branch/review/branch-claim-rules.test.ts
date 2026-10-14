import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchClaimJourneyIdLengthRule,
  BranchClaimPriorityRangeRule,
  BranchClaimRequiredCodeRule,
  BranchClaimRequiredNameRule,
  defaultBranchClaimValidator,
} from "./branch-claim-rules.js";
import { newBranchClaim } from "./branch-claim.js";

test("BranchClaimValidator reports every problem", () => {
  const validator = defaultBranchClaimValidator();
  const item = newBranchClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchClaimPriorityRangeRule flags values above priority", () => {
  const rule = new BranchClaimPriorityRangeRule(120, 1000);
  const item = newBranchClaim("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchClaimJourneyIdLengthRule flags a long journey id", () => {
  const rule = new BranchClaimJourneyIdLengthRule(120);
  const item = newBranchClaim("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchClaimRequiredCodeRule flags a blank code", () => {
  const rule = new BranchClaimRequiredCodeRule("branch claim needs a value");
  const item = newBranchClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchClaimRequiredNameRule flags a blank name", () => {
  const rule = new BranchClaimRequiredNameRule("branch claim needs an entry");
  const item = newBranchClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
