import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceDraftStore } from "./preference-draft-store.js";
import { newPreferenceDraft } from "./preference-draft.js";

test("MemoryPreferenceDraftStore finds what it saved", () => {
  const store = newMemoryPreferenceDraftStore();
  const item = newPreferenceDraft("code-59", "label-362");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
