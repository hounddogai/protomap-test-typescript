import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathSnapshotStore } from "./path-snapshot-store.js";
import { newPathSnapshot } from "./path-snapshot.js";

test("MemoryPathSnapshotStore finds what it saved", () => {
  const store = newMemoryPathSnapshotStore();
  const item = newPathSnapshot("code-544", "label-620");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
