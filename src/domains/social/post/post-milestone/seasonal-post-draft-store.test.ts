import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPostDraftStore } from "./seasonal-post-draft-store.js";
import { newSeasonalPostDraft } from "./seasonal-post-draft.js";

test("MemorySeasonalPostDraftStore finds what it saved", () => {
  const store = newMemorySeasonalPostDraftStore();
  const item = newSeasonalPostDraft("code-696", "title-402");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
