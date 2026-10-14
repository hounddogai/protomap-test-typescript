import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveFlightSnapshotStore } from "./adaptive-flight-snapshot-store.js";
import { newAdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

test("MemoryAdaptiveFlightSnapshotStore finds what it saved", () => {
  const store = newMemoryAdaptiveFlightSnapshotStore();
  const item = newAdaptiveFlightSnapshot("code-305", "label-578");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
