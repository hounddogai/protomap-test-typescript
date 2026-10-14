import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryConversionSnapshotStore } from "./primary-conversion-snapshot-store.js";
import { newPrimaryConversionSnapshot } from "./primary-conversion-snapshot.js";

test("MemoryPrimaryConversionSnapshotStore finds what it saved", () => {
  const store = newMemoryPrimaryConversionSnapshotStore();
  const item = newPrimaryConversionSnapshot("code-930", "label-304");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
