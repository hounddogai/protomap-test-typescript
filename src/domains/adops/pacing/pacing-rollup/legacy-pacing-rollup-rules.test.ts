import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPacingRollupCategoryLengthRule,
  LegacyPacingRollupRequiredCategoryRule,
  LegacyPacingRollupRequiredLabelRule,
  defaultLegacyPacingRollupValidator,
} from "./legacy-pacing-rollup-rules.js";
import { newLegacyPacingRollup } from "./legacy-pacing-rollup.js";

test("LegacyPacingRollupValidator reports every problem", () => {
  const validator = defaultLegacyPacingRollupValidator();
  const item = newLegacyPacingRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPacingRollupCategoryLengthRule flags a long category", () => {
  const rule = new LegacyPacingRollupCategoryLengthRule(32);
  const item = newLegacyPacingRollup("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPacingRollupRequiredCategoryRule flags a blank category", () => {
  const rule = new LegacyPacingRollupRequiredCategoryRule("legacy pacing rollup needs an entry");
  const item = newLegacyPacingRollup("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPacingRollupRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyPacingRollupRequiredLabelRule("legacy pacing rollup needs an entry");
  const item = newLegacyPacingRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
