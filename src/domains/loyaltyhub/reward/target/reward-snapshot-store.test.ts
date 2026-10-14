import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardSnapshotStore } from "./reward-snapshot-store.js";
import { newRewardSnapshot } from "./reward-snapshot.js";

test("MemoryRewardSnapshotStore finds what it saved", () => {
  const store = newMemoryRewardSnapshotStore();
  const item = newRewardSnapshot("code-958", "label-586");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
