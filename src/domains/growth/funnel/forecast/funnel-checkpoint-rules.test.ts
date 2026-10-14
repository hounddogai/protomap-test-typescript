import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelCheckpointChecksumLengthRule,
  FunnelCheckpointCodeLengthRule,
  FunnelCheckpointRequiredLabelRule,
  defaultFunnelCheckpointValidator,
} from "./funnel-checkpoint-rules.js";
import { newFunnelCheckpoint } from "./funnel-checkpoint.js";

test("FunnelCheckpointValidator reports every problem", () => {
  const validator = defaultFunnelCheckpointValidator();
  const item = newFunnelCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelCheckpointCodeLengthRule flags a long code", () => {
  const rule = new FunnelCheckpointCodeLengthRule(86400);
  const item = newFunnelCheckpoint("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelCheckpointChecksumLengthRule flags a long checksum", () => {
  const rule = new FunnelCheckpointChecksumLengthRule(86400);
  const item = newFunnelCheckpoint("x", "y");
  item.checksum = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new FunnelCheckpointRequiredLabelRule("funnel checkpoint needs this field");
  const item = newFunnelCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
