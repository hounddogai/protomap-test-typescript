import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyChallengePreferenceView,
  toLegacyChallengePreferenceViews,
} from "./legacy-challenge-preference-view.js";
import { newLegacyChallengePreference } from "./legacy-challenge-preference.js";

test("LegacyChallengePreferenceView shows the status in capitals", () => {
  const item = newLegacyChallengePreference("code-742", "title-103");
  const view = toLegacyChallengePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyChallengePreferenceViews([item, item]).length, 2, "views");
});
