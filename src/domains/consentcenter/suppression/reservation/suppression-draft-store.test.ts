import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionDraftStore } from "./suppression-draft-store.js";
import { newSuppressionDraft } from "./suppression-draft.js";

test("MemorySuppressionDraftStore finds what it saved", () => {
  const store = newMemorySuppressionDraftStore();
  const item = newSuppressionDraft("code-221", "title-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
