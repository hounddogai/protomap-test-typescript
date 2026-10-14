import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitDraftStore } from "./wait-draft-store.js";
import { newWaitDraft } from "./wait-draft.js";

test("MemoryWaitDraftStore finds what it saved", () => {
  const store = newMemoryWaitDraftStore();
  const item = newWaitDraft("code-827", "title-916");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
