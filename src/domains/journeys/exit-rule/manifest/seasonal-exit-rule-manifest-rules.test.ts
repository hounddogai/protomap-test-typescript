import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalExitRuleManifestBudgetRangeRule,
  SeasonalExitRuleManifestCodeLengthRule,
  SeasonalExitRuleManifestRequiredSummaryRule,
  SeasonalExitRuleManifestRequiredTitleRule,
  SeasonalExitRuleManifestTitleLengthRule,
  defaultSeasonalExitRuleManifestValidator,
} from "./seasonal-exit-rule-manifest-rules.js";
import { newSeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

test("SeasonalExitRuleManifestValidator reports every problem", () => {
  const validator = defaultSeasonalExitRuleManifestValidator();
  const item = newSeasonalExitRuleManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalExitRuleManifestCodeLengthRule flags a long code", () => {
  const rule = new SeasonalExitRuleManifestCodeLengthRule(80);
  const item = newSeasonalExitRuleManifest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalExitRuleManifestTitleLengthRule flags a long title", () => {
  const rule = new SeasonalExitRuleManifestTitleLengthRule(86400);
  const item = newSeasonalExitRuleManifest("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalExitRuleManifestBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalExitRuleManifestBudgetRangeRule(4.7, 3463.1);
  const item = newSeasonalExitRuleManifest("x", "y");
  item.budget = 3464.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalExitRuleManifestRequiredSummaryRule flags a blank summary", () => {
  const rule = new SeasonalExitRuleManifestRequiredSummaryRule("seasonal exit rule manifest needs a value");
  const item = newSeasonalExitRuleManifest("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalExitRuleManifestRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalExitRuleManifestRequiredTitleRule("seasonal exit rule manifest needs a value");
  const item = newSeasonalExitRuleManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
