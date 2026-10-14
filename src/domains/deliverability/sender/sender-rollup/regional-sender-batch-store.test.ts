import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSenderBatchStore } from "./regional-sender-batch-store.js";
import { newRegionalSenderBatch } from "./regional-sender-batch.js";

test("MemoryRegionalSenderBatchStore finds what it saved", () => {
  const store = newMemoryRegionalSenderBatchStore();
  const item = newRegionalSenderBatch("code-692", "label-10");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
