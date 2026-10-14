import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightSnapshotStore } from "./insight-snapshot-store.js";
import { newInsightSnapshot } from "./insight-snapshot.js";

test("MemoryInsightSnapshotStore finds what it saved", () => {
  const store = newMemoryInsightSnapshotStore();
  const item = newInsightSnapshot("code-53", "name-185");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
