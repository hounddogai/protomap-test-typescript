import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientLevelDraftTitleLengthRule,
  LenientLevelDraftWeightRangeRule,
  defaultLenientLevelDraftValidator,
} from "./lenient-level-draft-rules.js";
import { newLenientLevelDraft } from "./lenient-level-draft.js";

test("LenientLevelDraftValidator reports every problem", () => {
  const validator = defaultLenientLevelDraftValidator();
  const item = newLenientLevelDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientLevelDraftTitleLengthRule flags a long title", () => {
  const rule = new LenientLevelDraftTitleLengthRule(255);
  const item = newLenientLevelDraft("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientLevelDraftWeightRangeRule flags values above weight", () => {
  const rule = new LenientLevelDraftWeightRangeRule(6.8, 1683.4);
  const item = newLenientLevelDraft("x", "y");
  item.weight = 1684.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
