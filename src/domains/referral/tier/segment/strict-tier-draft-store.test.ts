import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTierDraftStore } from "./strict-tier-draft-store.js";
import { newStrictTierDraft } from "./strict-tier-draft.js";

test("MemoryStrictTierDraftStore finds what it saved", () => {
  const store = newMemoryStrictTierDraftStore();
  const item = newStrictTierDraft("code-550", "name-671");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
