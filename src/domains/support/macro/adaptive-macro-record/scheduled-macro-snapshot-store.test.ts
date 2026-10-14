import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledMacroSnapshotStore } from "./scheduled-macro-snapshot-store.js";
import { newScheduledMacroSnapshot } from "./scheduled-macro-snapshot.js";

test("MemoryScheduledMacroSnapshotStore finds what it saved", () => {
  const store = newMemoryScheduledMacroSnapshotStore();
  const item = newScheduledMacroSnapshot("code-64", "label-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
