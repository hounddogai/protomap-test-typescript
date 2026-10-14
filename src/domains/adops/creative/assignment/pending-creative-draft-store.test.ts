import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCreativeDraftStore } from "./pending-creative-draft-store.js";
import { newPendingCreativeDraft } from "./pending-creative-draft.js";

test("MemoryPendingCreativeDraftStore finds what it saved", () => {
  const store = newMemoryPendingCreativeDraftStore();
  const item = newPendingCreativeDraft("code-313", "title-508");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
