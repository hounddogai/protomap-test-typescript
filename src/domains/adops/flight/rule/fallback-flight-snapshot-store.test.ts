import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFlightSnapshotStore } from "./fallback-flight-snapshot-store.js";
import { newFallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

test("MemoryFallbackFlightSnapshotStore finds what it saved", () => {
  const store = newMemoryFallbackFlightSnapshotStore();
  const item = newFallbackFlightSnapshot("code-901", "label-874");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
