import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionBatchStore } from "./subscription-batch-store.js";
import { newSubscriptionBatch } from "./subscription-batch.js";

test("MemorySubscriptionBatchStore finds what it saved", () => {
  const store = newMemorySubscriptionBatchStore();
  const item = newSubscriptionBatch("code-108", "title-491");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
