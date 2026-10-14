import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPreferenceSnapshotStore } from "./regional-preference-snapshot-store.js";
import { newRegionalPreferenceSnapshot } from "./regional-preference-snapshot.js";

test("MemoryRegionalPreferenceSnapshotStore finds what it saved", () => {
  const store = newMemoryRegionalPreferenceSnapshotStore();
  const item = newRegionalPreferenceSnapshot("code-574", "label-969");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
