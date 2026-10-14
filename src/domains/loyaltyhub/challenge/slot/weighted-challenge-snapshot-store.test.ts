import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedChallengeSnapshotStore } from "./weighted-challenge-snapshot-store.js";
import { newWeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

test("MemoryWeightedChallengeSnapshotStore finds what it saved", () => {
  const store = newMemoryWeightedChallengeSnapshotStore();
  const item = newWeightedChallengeSnapshot("code-292", "name-206");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
