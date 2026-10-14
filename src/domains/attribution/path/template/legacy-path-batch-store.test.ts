import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPathBatchStore } from "./legacy-path-batch-store.js";
import { newLegacyPathBatch } from "./legacy-path-batch.js";

test("MemoryLegacyPathBatchStore finds what it saved", () => {
  const store = newMemoryLegacyPathBatchStore();
  const item = newLegacyPathBatch("code-20", "name-264");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
