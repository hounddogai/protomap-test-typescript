import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPathBatchStore } from "./seasonal-path-batch-store.js";
import { newSeasonalPathBatch } from "./seasonal-path-batch.js";

test("MemorySeasonalPathBatchStore finds what it saved", () => {
  const store = newMemorySeasonalPathBatchStore();
  const item = newSeasonalPathBatch("code-275", "label-733");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
