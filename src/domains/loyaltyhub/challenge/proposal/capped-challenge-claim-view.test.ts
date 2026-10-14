import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedChallengeClaimView, toCappedChallengeClaimViews } from "./capped-challenge-claim-view.js";
import { newCappedChallengeClaim } from "./capped-challenge-claim.js";

test("CappedChallengeClaimView shows the status in capitals", () => {
  const item = newCappedChallengeClaim("code-74", "name-57");
  const view = toCappedChallengeClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedChallengeClaimViews([item, item]).length, 2, "views");
});
