import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedChallengeSnapshotStore } from "./capped-challenge-snapshot-store.js";
import { newCappedChallengeSnapshot } from "./capped-challenge-snapshot.js";

test("MemoryCappedChallengeSnapshotStore finds what it saved", () => {
  const store = newMemoryCappedChallengeSnapshotStore();
  const item = newCappedChallengeSnapshot("code-83", "label-278");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
