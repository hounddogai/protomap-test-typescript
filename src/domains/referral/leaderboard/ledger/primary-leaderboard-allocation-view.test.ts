import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryLeaderboardAllocationView,
  toPrimaryLeaderboardAllocationViews,
} from "./primary-leaderboard-allocation-view.js";
import { newPrimaryLeaderboardAllocation } from "./primary-leaderboard-allocation.js";

test("PrimaryLeaderboardAllocationView shows the status in capitals", () => {
  const item = newPrimaryLeaderboardAllocation("code-476", "label-476");
  const view = toPrimaryLeaderboardAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryLeaderboardAllocationViews([item, item]).length, 2, "views");
});
