import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalLeaderboardAgreementView,
  toSeasonalLeaderboardAgreementViews,
} from "./seasonal-leaderboard-agreement-view.js";
import { newSeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

test("SeasonalLeaderboardAgreementView shows the status in capitals", () => {
  const item = newSeasonalLeaderboardAgreement("code-930", "name-84");
  const view = toSeasonalLeaderboardAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalLeaderboardAgreementViews([item, item]).length, 2, "views");
});
