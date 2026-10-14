import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionSnapshotStore } from "./conversion-snapshot-store.js";
import { newConversionSnapshot } from "./conversion-snapshot.js";

test("MemoryConversionSnapshotStore finds what it saved", () => {
  const store = newMemoryConversionSnapshotStore();
  const item = newConversionSnapshot("code-373", "name-373");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
