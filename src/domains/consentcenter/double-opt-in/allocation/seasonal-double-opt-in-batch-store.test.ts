import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalDoubleOptInBatchStore } from "./seasonal-double-opt-in-batch-store.js";
import { newSeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

test("MemorySeasonalDoubleOptInBatchStore finds what it saved", () => {
  const store = newMemorySeasonalDoubleOptInBatchStore();
  const item = newSeasonalDoubleOptInBatch("code-512", "label-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
