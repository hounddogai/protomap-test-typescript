import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeClaimView, toChallengeClaimViews } from "./challenge-claim-view.js";
import { newChallengeClaim } from "./challenge-claim.js";

test("ChallengeClaimView shows the status in capitals", () => {
  const item = newChallengeClaim("code-356", "label-513");
  const view = toChallengeClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeClaimViews([item, item]).length, 2, "views");
});
