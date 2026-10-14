import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengePreferenceView, toChallengePreferenceViews } from "./challenge-preference-view.js";
import { newChallengePreference } from "./challenge-preference.js";

test("ChallengePreferenceView shows the status in capitals", () => {
  const item = newChallengePreference("code-217", "name-858");
  const view = toChallengePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengePreferenceViews([item, item]).length, 2, "views");
});
