import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyChallengePreferenceStore } from "./legacy-challenge-preference-store.js";
import { newLegacyChallengePreference } from "./legacy-challenge-preference.js";

test("MemoryLegacyChallengePreferenceStore finds what it saved", () => {
  const store = newMemoryLegacyChallengePreferenceStore();
  const item = newLegacyChallengePreference("code-742", "title-103");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
