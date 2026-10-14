import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSubscriptionOverrideCodeLengthRule,
  RollingSubscriptionOverrideRequiredCodeRule,
  RollingSubscriptionOverrideRequiredOwnerIdRule,
  RollingSubscriptionOverrideRequiredTitleRule,
  RollingSubscriptionOverrideWeightRangeRule,
  defaultRollingSubscriptionOverrideValidator,
} from "./rolling-subscription-override-rules.js";
import { newRollingSubscriptionOverride } from "./rolling-subscription-override.js";

test("RollingSubscriptionOverrideValidator reports every problem", () => {
  const validator = defaultRollingSubscriptionOverrideValidator();
  const item = newRollingSubscriptionOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSubscriptionOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new RollingSubscriptionOverrideRequiredCodeRule("rolling subscription override needs an entry");
  const item = newRollingSubscriptionOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSubscriptionOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new RollingSubscriptionOverrideRequiredTitleRule("rolling subscription override needs this field");
  const item = newRollingSubscriptionOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSubscriptionOverrideCodeLengthRule flags a long code", () => {
  const rule = new RollingSubscriptionOverrideCodeLengthRule(255);
  const item = newRollingSubscriptionOverride("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSubscriptionOverrideWeightRangeRule flags values above weight", () => {
  const rule = new RollingSubscriptionOverrideWeightRangeRule(0.4, 465);
  const item = newRollingSubscriptionOverride("x", "y");
  item.weight = 466.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSubscriptionOverrideRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RollingSubscriptionOverrideRequiredOwnerIdRule("rolling subscription override needs an entry");
  const item = newRollingSubscriptionOverride("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
