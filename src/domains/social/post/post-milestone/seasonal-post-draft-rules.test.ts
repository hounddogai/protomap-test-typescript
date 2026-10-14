import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPostDraftBudgetRangeRule,
  SeasonalPostDraftRequiredChannelRule,
  SeasonalPostDraftRequiredTitleRule,
  SeasonalPostDraftTitleLengthRule,
  defaultSeasonalPostDraftValidator,
} from "./seasonal-post-draft-rules.js";
import { newSeasonalPostDraft } from "./seasonal-post-draft.js";

test("SeasonalPostDraftValidator reports every problem", () => {
  const validator = defaultSeasonalPostDraftValidator();
  const item = newSeasonalPostDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPostDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalPostDraftRequiredChannelRule("seasonal post draft needs a value");
  const item = newSeasonalPostDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPostDraftTitleLengthRule flags a long title", () => {
  const rule = new SeasonalPostDraftTitleLengthRule(64);
  const item = newSeasonalPostDraft("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPostDraftRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalPostDraftRequiredTitleRule("seasonal post draft needs a value");
  const item = newSeasonalPostDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPostDraftBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalPostDraftBudgetRangeRule(4.4, 3372.8);
  const item = newSeasonalPostDraft("x", "y");
  item.budget = 3374.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
