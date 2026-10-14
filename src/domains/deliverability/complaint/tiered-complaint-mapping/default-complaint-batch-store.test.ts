import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultComplaintBatchStore } from "./default-complaint-batch-store.js";
import { newDefaultComplaintBatch } from "./default-complaint-batch.js";

test("MemoryDefaultComplaintBatchStore finds what it saved", () => {
  const store = newMemoryDefaultComplaintBatchStore();
  const item = newDefaultComplaintBatch("code-859", "name-727");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
