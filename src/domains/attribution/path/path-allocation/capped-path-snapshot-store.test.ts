import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPathSnapshotStore } from "./capped-path-snapshot-store.js";
import { newCappedPathSnapshot } from "./capped-path-snapshot.js";

test("MemoryCappedPathSnapshotStore finds what it saved", () => {
  const store = newMemoryCappedPathSnapshotStore();
  const item = newCappedPathSnapshot("code-384", "title-712");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
