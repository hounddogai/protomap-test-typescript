import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackChallengeSnapshotStore } from "./fallback-challenge-snapshot-store.js";
import { newFallbackChallengeSnapshot } from "./fallback-challenge-snapshot.js";

test("MemoryFallbackChallengeSnapshotStore finds what it saved", () => {
  const store = newMemoryFallbackChallengeSnapshotStore();
  const item = newFallbackChallengeSnapshot("code-866", "label-2");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
