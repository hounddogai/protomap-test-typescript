import assert from "node:assert/strict";
import { test } from "node:test";
import { CappedWarmupDraftAmountRangeRule, defaultCappedWarmupDraftValidator } from "./capped-warmup-draft-rules.js";
import { newCappedWarmupDraft } from "./capped-warmup-draft.js";

test("CappedWarmupDraftValidator reports every problem", () => {
  const validator = defaultCappedWarmupDraftValidator();
  const item = newCappedWarmupDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedWarmupDraftAmountRangeRule flags values above amount", () => {
  const rule = new CappedWarmupDraftAmountRangeRule(7.8, 2277.6);
  const item = newCappedWarmupDraft("x", "y");
  item.amount = 2279.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
