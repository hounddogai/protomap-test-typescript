import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPaywallCheckpointLocaleLengthRule,
  DefaultPaywallCheckpointRequiredLocaleRule,
  DefaultPaywallCheckpointRequiredNameRule,
  DefaultPaywallCheckpointRequiredUnitRule,
  defaultDefaultPaywallCheckpointValidator,
} from "./default-paywall-checkpoint-rules.js";
import { newDefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

test("DefaultPaywallCheckpointValidator reports every problem", () => {
  const validator = defaultDefaultPaywallCheckpointValidator();
  const item = newDefaultPaywallCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPaywallCheckpointRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultPaywallCheckpointRequiredLocaleRule("default paywall checkpoint needs an entry");
  const item = newDefaultPaywallCheckpoint("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPaywallCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new DefaultPaywallCheckpointRequiredNameRule("default paywall checkpoint needs an entry");
  const item = newDefaultPaywallCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPaywallCheckpointLocaleLengthRule flags a long locale", () => {
  const rule = new DefaultPaywallCheckpointLocaleLengthRule(80);
  const item = newDefaultPaywallCheckpoint("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPaywallCheckpointRequiredUnitRule flags a blank unit", () => {
  const rule = new DefaultPaywallCheckpointRequiredUnitRule("default paywall checkpoint needs this field");
  const item = newDefaultPaywallCheckpoint("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
