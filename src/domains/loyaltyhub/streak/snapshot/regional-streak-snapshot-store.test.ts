import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalStreakSnapshotStore } from "./regional-streak-snapshot-store.js";
import { newRegionalStreakSnapshot } from "./regional-streak-snapshot.js";

test("MemoryRegionalStreakSnapshotStore finds what it saved", () => {
  const store = newMemoryRegionalStreakSnapshotStore();
  const item = newRegionalStreakSnapshot("code-912", "title-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
