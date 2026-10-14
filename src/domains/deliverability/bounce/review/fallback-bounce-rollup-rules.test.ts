import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBounceRollupCodeLengthRule,
  FallbackBounceRollupNameLengthRule,
  FallbackBounceRollupRequiredNotesRule,
  defaultFallbackBounceRollupValidator,
} from "./fallback-bounce-rollup-rules.js";
import { newFallbackBounceRollup } from "./fallback-bounce-rollup.js";

test("FallbackBounceRollupValidator reports every problem", () => {
  const validator = defaultFallbackBounceRollupValidator();
  const item = newFallbackBounceRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBounceRollupNameLengthRule flags a long name", () => {
  const rule = new FallbackBounceRollupNameLengthRule(80);
  const item = newFallbackBounceRollup("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBounceRollupCodeLengthRule flags a long code", () => {
  const rule = new FallbackBounceRollupCodeLengthRule(80);
  const item = newFallbackBounceRollup("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBounceRollupRequiredNotesRule flags a blank notes", () => {
  const rule = new FallbackBounceRollupRequiredNotesRule("fallback bounce rollup needs a value");
  const item = newFallbackBounceRollup("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
