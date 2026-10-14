import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPostSnapshotStore } from "./lenient-post-snapshot-store.js";
import { newLenientPostSnapshot } from "./lenient-post-snapshot.js";

test("MemoryLenientPostSnapshotStore finds what it saved", () => {
  const store = newMemoryLenientPostSnapshotStore();
  const item = newLenientPostSnapshot("code-620", "name-406");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
