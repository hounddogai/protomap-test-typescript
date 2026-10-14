import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionCheckpointStore } from "./subscription-checkpoint-store.js";
import { newSubscriptionCheckpoint } from "./subscription-checkpoint.js";

test("MemorySubscriptionCheckpointStore finds what it saved", () => {
  const store = newMemorySubscriptionCheckpointStore();
  const item = newSubscriptionCheckpoint("code-628", "label-305");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
