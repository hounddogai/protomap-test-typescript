import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationBatchStore } from "./activation-batch-store.js";
import { newActivationBatch } from "./activation-batch.js";

test("MemoryActivationBatchStore finds what it saved", () => {
  const store = newMemoryActivationBatchStore();
  const item = newActivationBatch("code-399", "label-786");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
