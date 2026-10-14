import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFlightDraftStore } from "./batched-flight-draft-store.js";
import { newBatchedFlightDraft } from "./batched-flight-draft.js";

test("MemoryBatchedFlightDraftStore finds what it saved", () => {
  const store = newMemoryBatchedFlightDraftStore();
  const item = newBatchedFlightDraft("code-918", "title-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
