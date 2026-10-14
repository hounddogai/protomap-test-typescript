import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofSnapshotStore } from "./proof-snapshot-store.js";
import { newProofSnapshot } from "./proof-snapshot.js";

test("MemoryProofSnapshotStore finds what it saved", () => {
  const store = newMemoryProofSnapshotStore();
  const item = newProofSnapshot("code-380", "title-643");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
