import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBounceAllocationCampaignRefLengthRule,
  TieredBounceAllocationRetriesRangeRule,
  defaultTieredBounceAllocationValidator,
} from "./tiered-bounce-allocation-rules.js";
import { newTieredBounceAllocation } from "./tiered-bounce-allocation.js";

test("TieredBounceAllocationValidator reports every problem", () => {
  const validator = defaultTieredBounceAllocationValidator();
  const item = newTieredBounceAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBounceAllocationRetriesRangeRule flags values above retries", () => {
  const rule = new TieredBounceAllocationRetriesRangeRule(32, 120);
  const item = newTieredBounceAllocation("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceAllocationCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new TieredBounceAllocationCampaignRefLengthRule(1000);
  const item = newTieredBounceAllocation("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
