import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceDraftStore } from "./bounce-draft-store.js";
import { newBounceDraft } from "./bounce-draft.js";

test("MemoryBounceDraftStore finds what it saved", () => {
  const store = newMemoryBounceDraftStore();
  const item = newBounceDraft("code-809", "title-338");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
