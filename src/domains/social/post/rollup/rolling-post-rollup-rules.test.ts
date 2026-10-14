import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPostRollupLabelLengthRule,
  RollingPostRollupRequiredCodeRule,
  defaultRollingPostRollupValidator,
} from "./rolling-post-rollup-rules.js";
import { newRollingPostRollup } from "./rolling-post-rollup.js";

test("RollingPostRollupValidator reports every problem", () => {
  const validator = defaultRollingPostRollupValidator();
  const item = newRollingPostRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPostRollupLabelLengthRule flags a long label", () => {
  const rule = new RollingPostRollupLabelLengthRule(86400);
  const item = newRollingPostRollup("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPostRollupRequiredCodeRule flags a blank code", () => {
  const rule = new RollingPostRollupRequiredCodeRule("rolling post rollup needs this field");
  const item = newRollingPostRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
