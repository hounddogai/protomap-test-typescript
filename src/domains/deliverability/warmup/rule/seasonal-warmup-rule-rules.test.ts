import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWarmupRuleRequiredChannelRule,
  SeasonalWarmupRuleRequiredNotesRule,
  defaultSeasonalWarmupRuleValidator,
} from "./seasonal-warmup-rule-rules.js";
import { newSeasonalWarmupRule } from "./seasonal-warmup-rule.js";

test("SeasonalWarmupRuleValidator reports every problem", () => {
  const validator = defaultSeasonalWarmupRuleValidator();
  const item = newSeasonalWarmupRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWarmupRuleRequiredNotesRule flags a blank notes", () => {
  const rule = new SeasonalWarmupRuleRequiredNotesRule("seasonal warmup rule needs this field");
  const item = newSeasonalWarmupRule("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWarmupRuleRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalWarmupRuleRequiredChannelRule("seasonal warmup rule needs an entry");
  const item = newSeasonalWarmupRule("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
