import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedModelSnapshotStore } from "./capped-model-snapshot-store.js";
import { newCappedModelSnapshot } from "./capped-model-snapshot.js";

test("MemoryCappedModelSnapshotStore finds what it saved", () => {
  const store = newMemoryCappedModelSnapshotStore();
  const item = newCappedModelSnapshot("code-228", "name-75");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
