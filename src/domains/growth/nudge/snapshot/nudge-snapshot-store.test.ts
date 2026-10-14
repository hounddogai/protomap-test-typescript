import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeSnapshotStore } from "./nudge-snapshot-store.js";
import { newNudgeSnapshot } from "./nudge-snapshot.js";

test("MemoryNudgeSnapshotStore finds what it saved", () => {
  const store = newMemoryNudgeSnapshotStore();
  const item = newNudgeSnapshot("code-103", "title-487");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
