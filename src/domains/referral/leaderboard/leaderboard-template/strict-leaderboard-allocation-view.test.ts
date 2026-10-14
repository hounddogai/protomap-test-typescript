import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictLeaderboardAllocationView,
  toStrictLeaderboardAllocationViews,
} from "./strict-leaderboard-allocation-view.js";
import { newStrictLeaderboardAllocation } from "./strict-leaderboard-allocation.js";

test("StrictLeaderboardAllocationView shows the status in capitals", () => {
  const item = newStrictLeaderboardAllocation("code-984", "title-303");
  const view = toStrictLeaderboardAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictLeaderboardAllocationViews([item, item]).length, 2, "views");
});
