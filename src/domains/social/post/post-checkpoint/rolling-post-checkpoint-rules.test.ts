import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPostCheckpointExternalRefLengthRule,
  RollingPostCheckpointRequiredCodeRule,
  RollingPostCheckpointUtmSourceLengthRule,
  defaultRollingPostCheckpointValidator,
} from "./rolling-post-checkpoint-rules.js";
import { newRollingPostCheckpoint } from "./rolling-post-checkpoint.js";

test("RollingPostCheckpointValidator reports every problem", () => {
  const validator = defaultRollingPostCheckpointValidator();
  const item = newRollingPostCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPostCheckpointUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RollingPostCheckpointUtmSourceLengthRule(32);
  const item = newRollingPostCheckpoint("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPostCheckpointExternalRefLengthRule flags a long external ref", () => {
  const rule = new RollingPostCheckpointExternalRefLengthRule(1000);
  const item = newRollingPostCheckpoint("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPostCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new RollingPostCheckpointRequiredCodeRule("rolling post checkpoint needs an entry");
  const item = newRollingPostCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
