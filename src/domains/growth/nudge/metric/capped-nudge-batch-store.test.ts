import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedNudgeBatchStore } from "./capped-nudge-batch-store.js";
import { newCappedNudgeBatch } from "./capped-nudge-batch.js";

test("MemoryCappedNudgeBatchStore finds what it saved", () => {
  const store = newMemoryCappedNudgeBatchStore();
  const item = newCappedNudgeBatch("code-145", "label-687");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
