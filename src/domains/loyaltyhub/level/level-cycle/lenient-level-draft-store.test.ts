import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientLevelDraftStore } from "./lenient-level-draft-store.js";
import { newLenientLevelDraft } from "./lenient-level-draft.js";

test("MemoryLenientLevelDraftStore finds what it saved", () => {
  const store = newMemoryLenientLevelDraftStore();
  const item = newLenientLevelDraft("code-638", "title-819");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
