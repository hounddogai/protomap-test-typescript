import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPostSnapshotStore } from "./primary-post-snapshot-store.js";
import { newPrimaryPostSnapshot } from "./primary-post-snapshot.js";

test("MemoryPrimaryPostSnapshotStore finds what it saved", () => {
  const store = newMemoryPrimaryPostSnapshotStore();
  const item = newPrimaryPostSnapshot("code-540", "label-507");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
