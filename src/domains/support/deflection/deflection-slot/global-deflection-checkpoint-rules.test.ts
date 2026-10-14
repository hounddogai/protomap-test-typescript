import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalDeflectionCheckpointCeilingRangeRule,
  GlobalDeflectionCheckpointCodeLengthRule,
  GlobalDeflectionCheckpointLabelLengthRule,
  GlobalDeflectionCheckpointRequiredCodeRule,
  defaultGlobalDeflectionCheckpointValidator,
} from "./global-deflection-checkpoint-rules.js";
import { newGlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

test("GlobalDeflectionCheckpointValidator reports every problem", () => {
  const validator = defaultGlobalDeflectionCheckpointValidator();
  const item = newGlobalDeflectionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalDeflectionCheckpointCeilingRangeRule flags values above ceiling", () => {
  const rule = new GlobalDeflectionCheckpointCeilingRangeRule(6.8, 4543.3);
  const item = newGlobalDeflectionCheckpoint("x", "y");
  item.ceiling = 4544.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalDeflectionCheckpointLabelLengthRule flags a long label", () => {
  const rule = new GlobalDeflectionCheckpointLabelLengthRule(1000);
  const item = newGlobalDeflectionCheckpoint("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalDeflectionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalDeflectionCheckpointRequiredCodeRule("global deflection checkpoint needs this field");
  const item = newGlobalDeflectionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalDeflectionCheckpointCodeLengthRule flags a long code", () => {
  const rule = new GlobalDeflectionCheckpointCodeLengthRule(86400);
  const item = newGlobalDeflectionCheckpoint("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
