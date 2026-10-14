import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedInsightSnapshotStore } from "./weighted-insight-snapshot-store.js";
import { newWeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

test("MemoryWeightedInsightSnapshotStore finds what it saved", () => {
  const store = newMemoryWeightedInsightSnapshotStore();
  const item = newWeightedInsightSnapshot("code-303", "label-476");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
