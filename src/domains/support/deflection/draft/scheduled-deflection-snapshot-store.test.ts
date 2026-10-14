import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDeflectionSnapshotStore } from "./scheduled-deflection-snapshot-store.js";
import { newScheduledDeflectionSnapshot } from "./scheduled-deflection-snapshot.js";

test("MemoryScheduledDeflectionSnapshotStore finds what it saved", () => {
  const store = newMemoryScheduledDeflectionSnapshotStore();
  const item = newScheduledDeflectionSnapshot("code-908", "name-603");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
