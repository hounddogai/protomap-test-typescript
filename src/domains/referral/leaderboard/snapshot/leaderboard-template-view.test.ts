import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardTemplateView, toLeaderboardTemplateViews } from "./leaderboard-template-view.js";
import { newLeaderboardTemplate } from "./leaderboard-template.js";

test("LeaderboardTemplateView shows the status in capitals", () => {
  const item = newLeaderboardTemplate("code-643", "name-96");
  const view = toLeaderboardTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardTemplateViews([item, item]).length, 2, "views");
});
