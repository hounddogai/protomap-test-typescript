import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeSnapshotStore } from "./challenge-snapshot-store.js";
import { newChallengeSnapshot } from "./challenge-snapshot.js";

test("MemoryChallengeSnapshotStore finds what it saved", () => {
  const store = newMemoryChallengeSnapshotStore();
  const item = newChallengeSnapshot("code-493", "title-413");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
