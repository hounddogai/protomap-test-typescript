import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPlacementDraftStore } from "./batched-placement-draft-store.js";
import { newBatchedPlacementDraft } from "./batched-placement-draft.js";

test("MemoryBatchedPlacementDraftStore finds what it saved", () => {
  const store = newMemoryBatchedPlacementDraftStore();
  const item = newBatchedPlacementDraft("code-566", "label-801");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
