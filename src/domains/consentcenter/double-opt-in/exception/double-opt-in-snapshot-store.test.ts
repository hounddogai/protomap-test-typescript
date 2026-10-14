import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInSnapshotStore } from "./double-opt-in-snapshot-store.js";
import { newDoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

test("MemoryDoubleOptInSnapshotStore finds what it saved", () => {
  const store = newMemoryDoubleOptInSnapshotStore();
  const item = newDoubleOptInSnapshot("code-299", "title-576");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
