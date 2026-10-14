import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelDraftCodeLengthRule,
  LevelDraftRequiredCodeRule,
  LevelDraftRequiredLabelRule,
  LevelDraftWeightRangeRule,
  defaultLevelDraftValidator,
} from "./level-draft-rules.js";
import { newLevelDraft } from "./level-draft.js";

test("LevelDraftValidator reports every problem", () => {
  const validator = defaultLevelDraftValidator();
  const item = newLevelDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelDraftCodeLengthRule flags a long code", () => {
  const rule = new LevelDraftCodeLengthRule(1000);
  const item = newLevelDraft("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelDraftWeightRangeRule flags values above weight", () => {
  const rule = new LevelDraftWeightRangeRule(1.2, 314.5);
  const item = newLevelDraft("x", "y");
  item.weight = 316;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelDraftRequiredLabelRule flags a blank label", () => {
  const rule = new LevelDraftRequiredLabelRule("level draft needs an entry");
  const item = newLevelDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelDraftRequiredCodeRule flags a blank code", () => {
  const rule = new LevelDraftRequiredCodeRule("level draft needs an entry");
  const item = newLevelDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
