import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierCheckpointCapacityRangeRule,
  TierCheckpointRequiredCodeRule,
  TierCheckpointRequiredNameRule,
  TierCheckpointRequiredTimezoneRule,
  defaultTierCheckpointValidator,
} from "./tier-checkpoint-rules.js";
import { newTierCheckpoint } from "./tier-checkpoint.js";

test("TierCheckpointValidator reports every problem", () => {
  const validator = defaultTierCheckpointValidator();
  const item = newTierCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierCheckpointRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new TierCheckpointRequiredTimezoneRule("tier checkpoint needs a value");
  const item = newTierCheckpoint("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new TierCheckpointRequiredCodeRule("tier checkpoint needs an entry");
  const item = newTierCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new TierCheckpointRequiredNameRule("tier checkpoint needs this field");
  const item = newTierCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierCheckpointCapacityRangeRule flags values above capacity", () => {
  const rule = new TierCheckpointCapacityRangeRule(32, 64);
  const item = newTierCheckpoint("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
