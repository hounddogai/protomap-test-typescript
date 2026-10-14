import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedComplaintWindowStore } from "./batched-complaint-window-store.js";
import { newBatchedComplaintWindow } from "./batched-complaint-window.js";

test("MemoryBatchedComplaintWindowStore finds what it saved", () => {
  const store = newMemoryBatchedComplaintWindowStore();
  const item = newBatchedComplaintWindow("code-518", "title-376");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
