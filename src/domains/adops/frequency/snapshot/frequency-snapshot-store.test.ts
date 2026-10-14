import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencySnapshotStore } from "./frequency-snapshot-store.js";
import { newFrequencySnapshot } from "./frequency-snapshot.js";

test("MemoryFrequencySnapshotStore finds what it saved", () => {
  const store = newMemoryFrequencySnapshotStore();
  const item = newFrequencySnapshot("code-385", "title-477");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
