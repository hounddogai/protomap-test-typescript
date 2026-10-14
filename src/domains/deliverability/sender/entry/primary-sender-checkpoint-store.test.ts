import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySenderCheckpointStore } from "./primary-sender-checkpoint-store.js";
import { newPrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

test("MemoryPrimarySenderCheckpointStore finds what it saved", () => {
  const store = newMemoryPrimarySenderCheckpointStore();
  const item = newPrimarySenderCheckpoint("code-662", "name-365");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
