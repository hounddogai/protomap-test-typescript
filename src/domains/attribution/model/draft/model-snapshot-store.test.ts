import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelSnapshotStore } from "./model-snapshot-store.js";
import { newModelSnapshot } from "./model-snapshot.js";

test("MemoryModelSnapshotStore finds what it saved", () => {
  const store = newMemoryModelSnapshotStore();
  const item = newModelSnapshot("code-628", "label-60");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
