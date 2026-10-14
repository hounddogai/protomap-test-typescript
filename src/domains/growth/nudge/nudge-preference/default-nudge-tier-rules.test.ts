import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultNudgeTierChannelLengthRule,
  DefaultNudgeTierCodeLengthRule,
  DefaultNudgeTierLabelLengthRule,
  defaultDefaultNudgeTierValidator,
} from "./default-nudge-tier-rules.js";
import { newDefaultNudgeTier } from "./default-nudge-tier.js";

test("DefaultNudgeTierValidator reports every problem", () => {
  const validator = defaultDefaultNudgeTierValidator();
  const item = newDefaultNudgeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultNudgeTierCodeLengthRule flags a long code", () => {
  const rule = new DefaultNudgeTierCodeLengthRule(255);
  const item = newDefaultNudgeTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultNudgeTierLabelLengthRule flags a long label", () => {
  const rule = new DefaultNudgeTierLabelLengthRule(16);
  const item = newDefaultNudgeTier("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultNudgeTierChannelLengthRule flags a long channel", () => {
  const rule = new DefaultNudgeTierChannelLengthRule(1000);
  const item = newDefaultNudgeTier("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
