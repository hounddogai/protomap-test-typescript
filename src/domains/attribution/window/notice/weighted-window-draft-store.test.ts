import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWindowDraftStore } from "./weighted-window-draft-store.js";
import { newWeightedWindowDraft } from "./weighted-window-draft.js";

test("MemoryWeightedWindowDraftStore finds what it saved", () => {
  const store = newMemoryWeightedWindowDraftStore();
  const item = newWeightedWindowDraft("code-561", "label-719");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
