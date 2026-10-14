import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredNudgeSnapshotStore } from "./tiered-nudge-snapshot-store.js";
import { newTieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

test("MemoryTieredNudgeSnapshotStore finds what it saved", () => {
  const store = newMemoryTieredNudgeSnapshotStore();
  const item = newTieredNudgeSnapshot("code-179", "title-531");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
