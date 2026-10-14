import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackChallengeOverrideStore } from "./fallback-challenge-override-store.js";
import { newFallbackChallengeOverride } from "./fallback-challenge-override.js";

test("MemoryFallbackChallengeOverrideStore finds what it saved", () => {
  const store = newMemoryFallbackChallengeOverrideStore();
  const item = newFallbackChallengeOverride("code-317", "name-22");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
