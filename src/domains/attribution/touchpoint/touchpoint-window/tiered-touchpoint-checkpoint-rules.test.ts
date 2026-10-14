import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTouchpointCheckpointAudienceIdLengthRule,
  TieredTouchpointCheckpointCeilingRangeRule,
  TieredTouchpointCheckpointLocaleLengthRule,
  TieredTouchpointCheckpointRequiredNameRule,
  TieredTouchpointCheckpointVersionRangeRule,
  defaultTieredTouchpointCheckpointValidator,
} from "./tiered-touchpoint-checkpoint-rules.js";
import { newTieredTouchpointCheckpoint } from "./tiered-touchpoint-checkpoint.js";

test("TieredTouchpointCheckpointValidator reports every problem", () => {
  const validator = defaultTieredTouchpointCheckpointValidator();
  const item = newTieredTouchpointCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTouchpointCheckpointVersionRangeRule flags values above version", () => {
  const rule = new TieredTouchpointCheckpointVersionRangeRule(16, 3600);
  const item = newTieredTouchpointCheckpoint("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredTouchpointCheckpointLocaleLengthRule flags a long locale", () => {
  const rule = new TieredTouchpointCheckpointLocaleLengthRule(3600);
  const item = newTieredTouchpointCheckpoint("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTouchpointCheckpointAudienceIdLengthRule flags a long audience id", () => {
  const rule = new TieredTouchpointCheckpointAudienceIdLengthRule(16);
  const item = newTieredTouchpointCheckpoint("x", "y");
  item.audienceId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTouchpointCheckpointCeilingRangeRule flags values above ceiling", () => {
  const rule = new TieredTouchpointCheckpointCeilingRangeRule(6.5, 2857.9);
  const item = newTieredTouchpointCheckpoint("x", "y");
  item.ceiling = 2859.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredTouchpointCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new TieredTouchpointCheckpointRequiredNameRule("tiered touchpoint checkpoint needs a value");
  const item = newTieredTouchpointCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
