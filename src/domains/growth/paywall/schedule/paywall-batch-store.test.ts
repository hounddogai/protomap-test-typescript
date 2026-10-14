import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallBatchStore } from "./paywall-batch-store.js";
import { newPaywallBatch } from "./paywall-batch.js";

test("MemoryPaywallBatchStore finds what it saved", () => {
  const store = newMemoryPaywallBatchStore();
  const item = newPaywallBatch("code-364", "title-38");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
