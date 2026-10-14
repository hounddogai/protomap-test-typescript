import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyChallengePreferenceRequiredOwnerIdRule,
  LegacyChallengePreferenceRequiredTitleRule,
  defaultLegacyChallengePreferenceValidator,
} from "./legacy-challenge-preference-rules.js";
import { newLegacyChallengePreference } from "./legacy-challenge-preference.js";

test("LegacyChallengePreferenceValidator reports every problem", () => {
  const validator = defaultLegacyChallengePreferenceValidator();
  const item = newLegacyChallengePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyChallengePreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyChallengePreferenceRequiredTitleRule("legacy challenge preference needs an entry");
  const item = newLegacyChallengePreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyChallengePreferenceRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LegacyChallengePreferenceRequiredOwnerIdRule("legacy challenge preference needs a value");
  const item = newLegacyChallengePreference("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
