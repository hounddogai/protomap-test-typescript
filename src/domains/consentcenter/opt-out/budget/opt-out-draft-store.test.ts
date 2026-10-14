import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutDraftStore } from "./opt-out-draft-store.js";
import { newOptOutDraft } from "./opt-out-draft.js";

test("MemoryOptOutDraftStore finds what it saved", () => {
  const store = newMemoryOptOutDraftStore();
  const item = newOptOutDraft("code-185", "label-655");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
