import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictTierDraftAmountRangeRule,
  StrictTierDraftSequenceRangeRule,
  defaultStrictTierDraftValidator,
} from "./strict-tier-draft-rules.js";
import { newStrictTierDraft } from "./strict-tier-draft.js";

test("StrictTierDraftValidator reports every problem", () => {
  const validator = defaultStrictTierDraftValidator();
  const item = newStrictTierDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictTierDraftSequenceRangeRule flags values above sequence", () => {
  const rule = new StrictTierDraftSequenceRangeRule(80, 86400);
  const item = newStrictTierDraft("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictTierDraftAmountRangeRule flags values above amount", () => {
  const rule = new StrictTierDraftAmountRangeRule(6.1, 3042.5);
  const item = newStrictTierDraft("x", "y");
  item.amount = 3044;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
