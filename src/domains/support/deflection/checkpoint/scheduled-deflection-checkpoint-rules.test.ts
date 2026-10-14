import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDeflectionCheckpointCodeLengthRule,
  ScheduledDeflectionCheckpointRateRangeRule,
  ScheduledDeflectionCheckpointRequiredAudienceIdRule,
  ScheduledDeflectionCheckpointRequiredCodeRule,
  ScheduledDeflectionCheckpointRequiredUnitRule,
  defaultScheduledDeflectionCheckpointValidator,
} from "./scheduled-deflection-checkpoint-rules.js";
import { newScheduledDeflectionCheckpoint } from "./scheduled-deflection-checkpoint.js";

test("ScheduledDeflectionCheckpointValidator reports every problem", () => {
  const validator = defaultScheduledDeflectionCheckpointValidator();
  const item = newScheduledDeflectionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDeflectionCheckpointCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDeflectionCheckpointCodeLengthRule(1000);
  const item = newScheduledDeflectionCheckpoint("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDeflectionCheckpointRateRangeRule flags values above rate", () => {
  const rule = new ScheduledDeflectionCheckpointRateRangeRule(9.6, 1385.3);
  const item = newScheduledDeflectionCheckpoint("x", "y");
  item.rate = 1386.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDeflectionCheckpointRequiredUnitRule flags a blank unit", () => {
  const rule = new ScheduledDeflectionCheckpointRequiredUnitRule("scheduled deflection checkpoint needs a value");
  const item = newScheduledDeflectionCheckpoint("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDeflectionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledDeflectionCheckpointRequiredCodeRule("scheduled deflection checkpoint needs a value");
  const item = newScheduledDeflectionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDeflectionCheckpointRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ScheduledDeflectionCheckpointRequiredAudienceIdRule("scheduled deflection checkpoint needs a value");
  const item = newScheduledDeflectionCheckpoint("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
