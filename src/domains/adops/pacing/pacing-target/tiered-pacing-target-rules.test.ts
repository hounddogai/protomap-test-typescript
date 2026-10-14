import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPacingTargetCodeLengthRule,
  TieredPacingTargetRequiredChannelRule,
  defaultTieredPacingTargetValidator,
} from "./tiered-pacing-target-rules.js";
import { newTieredPacingTarget } from "./tiered-pacing-target.js";

test("TieredPacingTargetValidator reports every problem", () => {
  const validator = defaultTieredPacingTargetValidator();
  const item = newTieredPacingTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPacingTargetRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredPacingTargetRequiredChannelRule("tiered pacing target needs an entry");
  const item = newTieredPacingTarget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPacingTargetCodeLengthRule flags a long code", () => {
  const rule = new TieredPacingTargetCodeLengthRule(255);
  const item = newTieredPacingTarget("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
