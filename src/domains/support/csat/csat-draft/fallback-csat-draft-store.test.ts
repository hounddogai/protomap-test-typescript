import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCsatDraftStore } from "./fallback-csat-draft-store.js";
import { newFallbackCsatDraft } from "./fallback-csat-draft.js";

test("MemoryFallbackCsatDraftStore finds what it saved", () => {
  const store = newMemoryFallbackCsatDraftStore();
  const item = newFallbackCsatDraft("code-58", "name-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
