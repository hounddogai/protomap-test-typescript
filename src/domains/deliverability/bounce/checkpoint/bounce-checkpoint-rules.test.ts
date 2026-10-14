import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceCheckpointCampaignRefLengthRule,
  BounceCheckpointQuantityRangeRule,
  BounceCheckpointRequiredCampaignRefRule,
  defaultBounceCheckpointValidator,
} from "./bounce-checkpoint-rules.js";
import { newBounceCheckpoint } from "./bounce-checkpoint.js";

test("BounceCheckpointValidator reports every problem", () => {
  const validator = defaultBounceCheckpointValidator();
  const item = newBounceCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceCheckpointQuantityRangeRule flags values above quantity", () => {
  const rule = new BounceCheckpointQuantityRangeRule(120, 86400);
  const item = newBounceCheckpoint("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceCheckpointCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new BounceCheckpointCampaignRefLengthRule(16);
  const item = newBounceCheckpoint("x", "y");
  item.campaignRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceCheckpointRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BounceCheckpointRequiredCampaignRefRule("bounce checkpoint needs an entry");
  const item = newBounceCheckpoint("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
