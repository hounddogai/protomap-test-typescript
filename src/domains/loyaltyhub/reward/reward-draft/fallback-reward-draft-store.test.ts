import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackRewardDraftStore } from "./fallback-reward-draft-store.js";
import { newFallbackRewardDraft } from "./fallback-reward-draft.js";

test("MemoryFallbackRewardDraftStore finds what it saved", () => {
  const store = newMemoryFallbackRewardDraftStore();
  const item = newFallbackRewardDraft("code-689", "name-760");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
