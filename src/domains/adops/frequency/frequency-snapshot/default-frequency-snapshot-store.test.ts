import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFrequencySnapshotStore } from "./default-frequency-snapshot-store.js";
import { newDefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

test("MemoryDefaultFrequencySnapshotStore finds what it saved", () => {
  const store = newMemoryDefaultFrequencySnapshotStore();
  const item = newDefaultFrequencySnapshot("code-960", "name-763");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
