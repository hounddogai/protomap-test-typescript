import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultConversionSnapshotStore } from "./default-conversion-snapshot-store.js";
import { newDefaultConversionSnapshot } from "./default-conversion-snapshot.js";

test("MemoryDefaultConversionSnapshotStore finds what it saved", () => {
  const store = newMemoryDefaultConversionSnapshotStore();
  const item = newDefaultConversionSnapshot("code-144", "name-363");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
