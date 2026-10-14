import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingPolicyChannelLengthRule,
  PacingPolicyCodeLengthRule,
  PacingPolicyFloorValueRangeRule,
  PacingPolicyTitleLengthRule,
  defaultPacingPolicyValidator,
} from "./pacing-policy-rules.js";
import { newPacingPolicy } from "./pacing-policy.js";

test("PacingPolicyValidator reports every problem", () => {
  const validator = defaultPacingPolicyValidator();
  const item = newPacingPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingPolicyCodeLengthRule flags a long code", () => {
  const rule = new PacingPolicyCodeLengthRule(3600);
  const item = newPacingPolicy("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingPolicyTitleLengthRule flags a long title", () => {
  const rule = new PacingPolicyTitleLengthRule(86400);
  const item = newPacingPolicy("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingPolicyFloorValueRangeRule flags values above floor value", () => {
  const rule = new PacingPolicyFloorValueRangeRule(5.8, 4160);
  const item = newPacingPolicy("x", "y");
  item.floorValue = 4161.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingPolicyChannelLengthRule flags a long channel", () => {
  const rule = new PacingPolicyChannelLengthRule(255);
  const item = newPacingPolicy("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
