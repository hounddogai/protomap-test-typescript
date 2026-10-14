import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultMacroSnapshotStore } from "./default-macro-snapshot-store.js";
import { newDefaultMacroSnapshot } from "./default-macro-snapshot.js";

test("MemoryDefaultMacroSnapshotStore finds what it saved", () => {
  const store = newMemoryDefaultMacroSnapshotStore();
  const item = newDefaultMacroSnapshot("code-152", "name-923");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
