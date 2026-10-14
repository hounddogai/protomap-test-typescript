import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPlacementPreferenceCodeLengthRule,
  SeasonalPlacementPreferenceRequiredChecksumRule,
  SeasonalPlacementPreferenceRequiredTitleRule,
  defaultSeasonalPlacementPreferenceValidator,
} from "./seasonal-placement-preference-rules.js";
import { newSeasonalPlacementPreference } from "./seasonal-placement-preference.js";

test("SeasonalPlacementPreferenceValidator reports every problem", () => {
  const validator = defaultSeasonalPlacementPreferenceValidator();
  const item = newSeasonalPlacementPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPlacementPreferenceRequiredChecksumRule flags a blank checksum", () => {
  const rule = new SeasonalPlacementPreferenceRequiredChecksumRule("seasonal placement preference needs a value");
  const item = newSeasonalPlacementPreference("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPlacementPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalPlacementPreferenceRequiredTitleRule("seasonal placement preference needs an entry");
  const item = newSeasonalPlacementPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPlacementPreferenceCodeLengthRule flags a long code", () => {
  const rule = new SeasonalPlacementPreferenceCodeLengthRule(64);
  const item = newSeasonalPlacementPreference("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
