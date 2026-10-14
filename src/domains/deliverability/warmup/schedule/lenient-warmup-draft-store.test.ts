import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWarmupDraftStore } from "./lenient-warmup-draft-store.js";
import { newLenientWarmupDraft } from "./lenient-warmup-draft.js";

test("MemoryLenientWarmupDraftStore finds what it saved", () => {
  const store = newMemoryLenientWarmupDraftStore();
  const item = newLenientWarmupDraft("code-896", "label-408");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
