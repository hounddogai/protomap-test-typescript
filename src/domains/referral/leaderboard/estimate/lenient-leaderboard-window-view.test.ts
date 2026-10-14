import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientLeaderboardWindowView,
  toLenientLeaderboardWindowViews,
} from "./lenient-leaderboard-window-view.js";
import { newLenientLeaderboardWindow } from "./lenient-leaderboard-window.js";

test("LenientLeaderboardWindowView shows the status in capitals", () => {
  const item = newLenientLeaderboardWindow("code-556", "label-587");
  const view = toLenientLeaderboardWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientLeaderboardWindowViews([item, item]).length, 2, "views");
});
