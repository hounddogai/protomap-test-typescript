import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalChallengeSnapshotStore } from "./global-challenge-snapshot-store.js";
import { newGlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

test("MemoryGlobalChallengeSnapshotStore finds what it saved", () => {
  const store = newMemoryGlobalChallengeSnapshotStore();
  const item = newGlobalChallengeSnapshot("code-54", "name-365");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
