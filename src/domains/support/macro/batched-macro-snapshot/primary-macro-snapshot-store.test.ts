import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryMacroSnapshotStore } from "./primary-macro-snapshot-store.js";
import { newPrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

test("MemoryPrimaryMacroSnapshotStore finds what it saved", () => {
  const store = newMemoryPrimaryMacroSnapshotStore();
  const item = newPrimaryMacroSnapshot("code-847", "name-230");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
