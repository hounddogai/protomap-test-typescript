import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveLeaderboardSegmentStore } from "./adaptive-leaderboard-segment-store.js";
import { newAdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

test("MemoryAdaptiveLeaderboardSegmentStore finds what it saved", () => {
  const store = newMemoryAdaptiveLeaderboardSegmentStore();
  const item = newAdaptiveLeaderboardSegment("code-464", "name-382");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
