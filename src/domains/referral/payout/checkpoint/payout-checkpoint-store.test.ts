import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutCheckpointStore } from "./payout-checkpoint-store.js";
import { newPayoutCheckpoint } from "./payout-checkpoint.js";

test("MemoryPayoutCheckpointStore finds what it saved", () => {
  const store = newMemoryPayoutCheckpointStore();
  const item = newPayoutCheckpoint("code-277", "name-626");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
