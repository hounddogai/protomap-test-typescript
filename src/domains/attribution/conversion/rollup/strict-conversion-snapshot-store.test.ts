import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictConversionSnapshotStore } from "./strict-conversion-snapshot-store.js";
import { newStrictConversionSnapshot } from "./strict-conversion-snapshot.js";

test("MemoryStrictConversionSnapshotStore finds what it saved", () => {
  const store = newMemoryStrictConversionSnapshotStore();
  const item = newStrictConversionSnapshot("code-632", "label-189");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
