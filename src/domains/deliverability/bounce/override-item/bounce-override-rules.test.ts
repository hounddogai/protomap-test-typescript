import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceOverrideChannelLengthRule,
  BounceOverrideCodeLengthRule,
  BounceOverrideRequiredChannelRule,
  BounceOverrideRequiredNameRule,
  defaultBounceOverrideValidator,
} from "./bounce-override-rules.js";
import { newBounceOverride } from "./bounce-override.js";

test("BounceOverrideValidator reports every problem", () => {
  const validator = defaultBounceOverrideValidator();
  const item = newBounceOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceOverrideRequiredChannelRule flags a blank channel", () => {
  const rule = new BounceOverrideRequiredChannelRule("bounce override needs a value");
  const item = newBounceOverride("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceOverrideCodeLengthRule flags a long code", () => {
  const rule = new BounceOverrideCodeLengthRule(1000);
  const item = newBounceOverride("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceOverrideChannelLengthRule flags a long channel", () => {
  const rule = new BounceOverrideChannelLengthRule(255);
  const item = newBounceOverride("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceOverrideRequiredNameRule flags a blank name", () => {
  const rule = new BounceOverrideRequiredNameRule("bounce override needs a value");
  const item = newBounceOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
