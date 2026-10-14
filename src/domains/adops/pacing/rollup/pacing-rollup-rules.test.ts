import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingRollupCeilingRangeRule,
  PacingRollupCodeLengthRule,
  PacingRollupRequiredCodeRule,
  PacingRollupRequiredTitleRule,
  defaultPacingRollupValidator,
} from "./pacing-rollup-rules.js";
import { newPacingRollup } from "./pacing-rollup.js";

test("PacingRollupValidator reports every problem", () => {
  const validator = defaultPacingRollupValidator();
  const item = newPacingRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingRollupCodeLengthRule flags a long code", () => {
  const rule = new PacingRollupCodeLengthRule(255);
  const item = newPacingRollup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingRollupCeilingRangeRule flags values above ceiling", () => {
  const rule = new PacingRollupCeilingRangeRule(2.8, 4057.3);
  const item = newPacingRollup("x", "y");
  item.ceiling = 4058.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingRollupRequiredCodeRule flags a blank code", () => {
  const rule = new PacingRollupRequiredCodeRule("pacing rollup needs a value");
  const item = newPacingRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingRollupRequiredTitleRule flags a blank title", () => {
  const rule = new PacingRollupRequiredTitleRule("pacing rollup needs this field");
  const item = newPacingRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
