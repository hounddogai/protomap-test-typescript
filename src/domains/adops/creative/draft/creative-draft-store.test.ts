import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeDraftStore } from "./creative-draft-store.js";
import { newCreativeDraft } from "./creative-draft.js";

test("MemoryCreativeDraftStore finds what it saved", () => {
  const store = newMemoryCreativeDraftStore();
  const item = newCreativeDraft("code-339", "name-565");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
