import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalStepDraftCapacityRangeRule,
  SeasonalStepDraftJourneyIdLengthRule,
  SeasonalStepDraftNameLengthRule,
  SeasonalStepDraftRequiredCodeRule,
  defaultSeasonalStepDraftValidator,
} from "./seasonal-step-draft-rules.js";
import { newSeasonalStepDraft } from "./seasonal-step-draft.js";

test("SeasonalStepDraftValidator reports every problem", () => {
  const validator = defaultSeasonalStepDraftValidator();
  const item = newSeasonalStepDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalStepDraftJourneyIdLengthRule flags a long journey id", () => {
  const rule = new SeasonalStepDraftJourneyIdLengthRule(3600);
  const item = newSeasonalStepDraft("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalStepDraftNameLengthRule flags a long name", () => {
  const rule = new SeasonalStepDraftNameLengthRule(86400);
  const item = newSeasonalStepDraft("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalStepDraftCapacityRangeRule flags values above capacity", () => {
  const rule = new SeasonalStepDraftCapacityRangeRule(64, 64);
  const item = newSeasonalStepDraft("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalStepDraftRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalStepDraftRequiredCodeRule("seasonal step draft needs an entry");
  const item = newSeasonalStepDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
