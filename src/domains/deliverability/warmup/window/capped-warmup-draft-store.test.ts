import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedWarmupDraftStore } from "./capped-warmup-draft-store.js";
import { newCappedWarmupDraft } from "./capped-warmup-draft.js";

test("MemoryCappedWarmupDraftStore finds what it saved", () => {
  const store = newMemoryCappedWarmupDraftStore();
  const item = newCappedWarmupDraft("code-490", "name-326");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
