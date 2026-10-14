import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBounceBatchStore } from "./primary-bounce-batch-store.js";
import { newPrimaryBounceBatch } from "./primary-bounce-batch.js";

test("MemoryPrimaryBounceBatchStore finds what it saved", () => {
  const store = newMemoryPrimaryBounceBatchStore();
  const item = newPrimaryBounceBatch("code-979", "title-970");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
