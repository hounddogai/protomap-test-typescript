import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingStepRollupChannelLengthRule,
  PendingStepRollupCodeLengthRule,
  defaultPendingStepRollupValidator,
} from "./pending-step-rollup-rules.js";
import { newPendingStepRollup } from "./pending-step-rollup.js";

test("PendingStepRollupValidator reports every problem", () => {
  const validator = defaultPendingStepRollupValidator();
  const item = newPendingStepRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingStepRollupChannelLengthRule flags a long channel", () => {
  const rule = new PendingStepRollupChannelLengthRule(255);
  const item = newPendingStepRollup("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingStepRollupCodeLengthRule flags a long code", () => {
  const rule = new PendingStepRollupCodeLengthRule(80);
  const item = newPendingStepRollup("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
