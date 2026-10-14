import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingReputationAllocationClicksRangeRule,
  PendingReputationAllocationExpiresAtRangeRule,
  PendingReputationAllocationJourneyIdLengthRule,
  PendingReputationAllocationNameLengthRule,
  PendingReputationAllocationRequiredNameRule,
  defaultPendingReputationAllocationValidator,
} from "./pending-reputation-allocation-rules.js";
import { newPendingReputationAllocation } from "./pending-reputation-allocation.js";

test("PendingReputationAllocationValidator reports every problem", () => {
  const validator = defaultPendingReputationAllocationValidator();
  const item = newPendingReputationAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingReputationAllocationExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PendingReputationAllocationExpiresAtRangeRule(64, 120);
  const item = newPendingReputationAllocation("x", "y");
  item.expiresAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingReputationAllocationClicksRangeRule flags values above clicks", () => {
  const rule = new PendingReputationAllocationClicksRangeRule(1000, 1000);
  const item = newPendingReputationAllocation("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingReputationAllocationRequiredNameRule flags a blank name", () => {
  const rule = new PendingReputationAllocationRequiredNameRule("pending reputation allocation needs this field");
  const item = newPendingReputationAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingReputationAllocationNameLengthRule flags a long name", () => {
  const rule = new PendingReputationAllocationNameLengthRule(86400);
  const item = newPendingReputationAllocation("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingReputationAllocationJourneyIdLengthRule flags a long journey id", () => {
  const rule = new PendingReputationAllocationJourneyIdLengthRule(255);
  const item = newPendingReputationAllocation("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
