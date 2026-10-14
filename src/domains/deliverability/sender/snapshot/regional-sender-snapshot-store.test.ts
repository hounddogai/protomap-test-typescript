import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSenderSnapshotStore } from "./regional-sender-snapshot-store.js";
import { newRegionalSenderSnapshot } from "./regional-sender-snapshot.js";

test("MemoryRegionalSenderSnapshotStore finds what it saved", () => {
  const store = newMemoryRegionalSenderSnapshotStore();
  const item = newRegionalSenderSnapshot("code-101", "label-943");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
