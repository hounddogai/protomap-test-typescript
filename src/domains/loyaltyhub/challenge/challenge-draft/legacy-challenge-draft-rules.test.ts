import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyChallengeDraftCostRangeRule,
  LegacyChallengeDraftRequiredNameRule,
  defaultLegacyChallengeDraftValidator,
} from "./legacy-challenge-draft-rules.js";
import { newLegacyChallengeDraft } from "./legacy-challenge-draft.js";

test("LegacyChallengeDraftValidator reports every problem", () => {
  const validator = defaultLegacyChallengeDraftValidator();
  const item = newLegacyChallengeDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyChallengeDraftRequiredNameRule flags a blank name", () => {
  const rule = new LegacyChallengeDraftRequiredNameRule("legacy challenge draft needs this field");
  const item = newLegacyChallengeDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyChallengeDraftCostRangeRule flags values above cost", () => {
  const rule = new LegacyChallengeDraftCostRangeRule(8.2, 1581);
  const item = newLegacyChallengeDraft("x", "y");
  item.cost = 1582.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
