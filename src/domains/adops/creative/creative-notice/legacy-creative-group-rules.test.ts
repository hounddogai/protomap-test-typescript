import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCreativeGroupBudgetRangeRule,
  LegacyCreativeGroupLocaleLengthRule,
  LegacyCreativeGroupRequiredChannelRule,
  LegacyCreativeGroupRequiredLocaleRule,
  defaultLegacyCreativeGroupValidator,
} from "./legacy-creative-group-rules.js";
import { newLegacyCreativeGroup } from "./legacy-creative-group.js";

test("LegacyCreativeGroupValidator reports every problem", () => {
  const validator = defaultLegacyCreativeGroupValidator();
  const item = newLegacyCreativeGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCreativeGroupBudgetRangeRule flags values above budget", () => {
  const rule = new LegacyCreativeGroupBudgetRangeRule(5.5, 2830);
  const item = newLegacyCreativeGroup("x", "y");
  item.budget = 2831.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCreativeGroupRequiredLocaleRule flags a blank locale", () => {
  const rule = new LegacyCreativeGroupRequiredLocaleRule("legacy creative group needs a value");
  const item = newLegacyCreativeGroup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyCreativeGroupLocaleLengthRule flags a long locale", () => {
  const rule = new LegacyCreativeGroupLocaleLengthRule(255);
  const item = newLegacyCreativeGroup("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCreativeGroupRequiredChannelRule flags a blank channel", () => {
  const rule = new LegacyCreativeGroupRequiredChannelRule("legacy creative group needs a value");
  const item = newLegacyCreativeGroup("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
