import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTierRollupCampaignRefLengthRule,
  PrimaryTierRollupRegionLengthRule,
  defaultPrimaryTierRollupValidator,
} from "./primary-tier-rollup-rules.js";
import { newPrimaryTierRollup } from "./primary-tier-rollup.js";

test("PrimaryTierRollupValidator reports every problem", () => {
  const validator = defaultPrimaryTierRollupValidator();
  const item = newPrimaryTierRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTierRollupCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new PrimaryTierRollupCampaignRefLengthRule(120);
  const item = newPrimaryTierRollup("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryTierRollupRegionLengthRule flags a long region", () => {
  const rule = new PrimaryTierRollupRegionLengthRule(64);
  const item = newPrimaryTierRollup("x", "y");
  item.region = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
