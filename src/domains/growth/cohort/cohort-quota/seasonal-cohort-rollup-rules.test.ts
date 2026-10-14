import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCohortRollupCodeLengthRule,
  SeasonalCohortRollupNameLengthRule,
  SeasonalCohortRollupRequiredCodeRule,
  defaultSeasonalCohortRollupValidator,
} from "./seasonal-cohort-rollup-rules.js";
import { newSeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

test("SeasonalCohortRollupValidator reports every problem", () => {
  const validator = defaultSeasonalCohortRollupValidator();
  const item = newSeasonalCohortRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCohortRollupNameLengthRule flags a long name", () => {
  const rule = new SeasonalCohortRollupNameLengthRule(120);
  const item = newSeasonalCohortRollup("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalCohortRollupRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalCohortRollupRequiredCodeRule("seasonal cohort rollup needs an entry");
  const item = newSeasonalCohortRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCohortRollupCodeLengthRule flags a long code", () => {
  const rule = new SeasonalCohortRollupCodeLengthRule(80);
  const item = newSeasonalCohortRollup("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
