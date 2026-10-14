import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueVarianceStore } from "./queue-variance-store.js";
import { newQueueVariance } from "./queue-variance.js";

test("MemoryQueueVarianceStore finds what it saved", () => {
  const store = newMemoryQueueVarianceStore();
  const item = newQueueVariance("code-986", "label-319");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
