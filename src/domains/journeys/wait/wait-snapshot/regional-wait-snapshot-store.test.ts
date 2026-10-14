import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalWaitSnapshotStore } from "./regional-wait-snapshot-store.js";
import { newRegionalWaitSnapshot } from "./regional-wait-snapshot.js";

test("MemoryRegionalWaitSnapshotStore finds what it saved", () => {
  const store = newMemoryRegionalWaitSnapshotStore();
  const item = newRegionalWaitSnapshot("code-698", "title-668");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
