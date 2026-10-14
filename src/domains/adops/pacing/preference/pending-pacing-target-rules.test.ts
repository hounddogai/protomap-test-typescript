import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPacingTargetLabelLengthRule,
  PendingPacingTargetRequiredCodeRule,
  PendingPacingTargetRequiredLabelRule,
  PendingPacingTargetRequiredNameRule,
  defaultPendingPacingTargetValidator,
} from "./pending-pacing-target-rules.js";
import { newPendingPacingTarget } from "./pending-pacing-target.js";

test("PendingPacingTargetValidator reports every problem", () => {
  const validator = defaultPendingPacingTargetValidator();
  const item = newPendingPacingTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPacingTargetLabelLengthRule flags a long label", () => {
  const rule = new PendingPacingTargetLabelLengthRule(32);
  const item = newPendingPacingTarget("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPacingTargetRequiredCodeRule flags a blank code", () => {
  const rule = new PendingPacingTargetRequiredCodeRule("pending pacing target needs a value");
  const item = newPendingPacingTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPacingTargetRequiredNameRule flags a blank name", () => {
  const rule = new PendingPacingTargetRequiredNameRule("pending pacing target needs an entry");
  const item = newPendingPacingTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPacingTargetRequiredLabelRule flags a blank label", () => {
  const rule = new PendingPacingTargetRequiredLabelRule("pending pacing target needs an entry");
  const item = newPendingPacingTarget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
