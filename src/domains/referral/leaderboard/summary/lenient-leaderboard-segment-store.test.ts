import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientLeaderboardSegmentStore } from "./lenient-leaderboard-segment-store.js";
import { newLenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

test("MemoryLenientLeaderboardSegmentStore finds what it saved", () => {
  const store = newMemoryLenientLeaderboardSegmentStore();
  const item = newLenientLeaderboardSegment("code-70", "name-945");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
