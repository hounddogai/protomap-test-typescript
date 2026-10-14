import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientLeaderboardSegmentView,
  toLenientLeaderboardSegmentViews,
} from "./lenient-leaderboard-segment-view.js";
import { newLenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

test("LenientLeaderboardSegmentView shows the status in capitals", () => {
  const item = newLenientLeaderboardSegment("code-70", "name-945");
  const view = toLenientLeaderboardSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientLeaderboardSegmentViews([item, item]).length, 2, "views");
});
