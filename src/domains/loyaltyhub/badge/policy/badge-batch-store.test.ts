import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeBatchStore } from "./badge-batch-store.js";
import { newBadgeBatch } from "./badge-batch.js";

test("MemoryBadgeBatchStore finds what it saved", () => {
  const store = newMemoryBadgeBatchStore();
  const item = newBadgeBatch("code-906", "name-468");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
