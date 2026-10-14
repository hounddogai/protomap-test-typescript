import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedSenderGroupStore } from "./batched-sender-group-store.js";
import { newBatchedSenderGroup } from "./batched-sender-group.js";

test("MemoryBatchedSenderGroupStore finds what it saved", () => {
  const store = newMemoryBatchedSenderGroupStore();
  const item = newBatchedSenderGroup("code-917", "name-384");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
