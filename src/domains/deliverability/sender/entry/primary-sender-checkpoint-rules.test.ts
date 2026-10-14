import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySenderCheckpointCampaignRefLengthRule,
  PrimarySenderCheckpointCapacityRangeRule,
  PrimarySenderCheckpointRequiredCodeRule,
  defaultPrimarySenderCheckpointValidator,
} from "./primary-sender-checkpoint-rules.js";
import { newPrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

test("PrimarySenderCheckpointValidator reports every problem", () => {
  const validator = defaultPrimarySenderCheckpointValidator();
  const item = newPrimarySenderCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySenderCheckpointCapacityRangeRule flags values above capacity", () => {
  const rule = new PrimarySenderCheckpointCapacityRangeRule(120, 120);
  const item = newPrimarySenderCheckpoint("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySenderCheckpointCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new PrimarySenderCheckpointCampaignRefLengthRule(3600);
  const item = newPrimarySenderCheckpoint("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimarySenderCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new PrimarySenderCheckpointRequiredCodeRule("primary sender checkpoint needs this field");
  const item = newPrimarySenderCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
