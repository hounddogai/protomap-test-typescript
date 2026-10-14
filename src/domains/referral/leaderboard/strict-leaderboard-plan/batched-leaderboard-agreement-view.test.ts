import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedLeaderboardAgreementView,
  toBatchedLeaderboardAgreementViews,
} from "./batched-leaderboard-agreement-view.js";
import { newBatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

test("BatchedLeaderboardAgreementView shows the status in capitals", () => {
  const item = newBatchedLeaderboardAgreement("code-318", "title-342");
  const view = toBatchedLeaderboardAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedLeaderboardAgreementViews([item, item]).length, 2, "views");
});
