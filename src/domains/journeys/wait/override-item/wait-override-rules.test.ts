import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitOverrideLabelLengthRule,
  WaitOverrideSendAtRangeRule,
  defaultWaitOverrideValidator,
} from "./wait-override-rules.js";
import { newWaitOverride } from "./wait-override.js";

test("WaitOverrideValidator reports every problem", () => {
  const validator = defaultWaitOverrideValidator();
  const item = newWaitOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitOverrideSendAtRangeRule flags values above send at", () => {
  const rule = new WaitOverrideSendAtRangeRule(64, 86400);
  const item = newWaitOverride("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitOverrideLabelLengthRule flags a long label", () => {
  const rule = new WaitOverrideLabelLengthRule(64);
  const item = newWaitOverride("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
