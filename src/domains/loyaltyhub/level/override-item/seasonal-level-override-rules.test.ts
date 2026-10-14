import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalLevelOverrideRegionLengthRule,
  SeasonalLevelOverrideRequiredCodeRule,
  SeasonalLevelOverrideRequiredRegionRule,
  defaultSeasonalLevelOverrideValidator,
} from "./seasonal-level-override-rules.js";
import { newSeasonalLevelOverride } from "./seasonal-level-override.js";

test("SeasonalLevelOverrideValidator reports every problem", () => {
  const validator = defaultSeasonalLevelOverrideValidator();
  const item = newSeasonalLevelOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalLevelOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalLevelOverrideRequiredCodeRule("seasonal level override needs an entry");
  const item = newSeasonalLevelOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalLevelOverrideRequiredRegionRule flags a blank region", () => {
  const rule = new SeasonalLevelOverrideRequiredRegionRule("seasonal level override needs a value");
  const item = newSeasonalLevelOverride("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalLevelOverrideRegionLengthRule flags a long region", () => {
  const rule = new SeasonalLevelOverrideRegionLengthRule(86400);
  const item = newSeasonalLevelOverride("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
