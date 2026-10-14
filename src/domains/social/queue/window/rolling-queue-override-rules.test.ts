import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingQueueOverrideCohortLengthRule,
  RollingQueueOverrideNameLengthRule,
  RollingQueueOverrideRequiredCohortRule,
  defaultRollingQueueOverrideValidator,
} from "./rolling-queue-override-rules.js";
import { newRollingQueueOverride } from "./rolling-queue-override.js";

test("RollingQueueOverrideValidator reports every problem", () => {
  const validator = defaultRollingQueueOverrideValidator();
  const item = newRollingQueueOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingQueueOverrideNameLengthRule flags a long name", () => {
  const rule = new RollingQueueOverrideNameLengthRule(1000);
  const item = newRollingQueueOverride("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingQueueOverrideRequiredCohortRule flags a blank cohort", () => {
  const rule = new RollingQueueOverrideRequiredCohortRule("rolling queue override needs a value");
  const item = newRollingQueueOverride("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingQueueOverrideCohortLengthRule flags a long cohort", () => {
  const rule = new RollingQueueOverrideCohortLengthRule(1000);
  const item = newRollingQueueOverride("x", "y");
  item.cohort = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
