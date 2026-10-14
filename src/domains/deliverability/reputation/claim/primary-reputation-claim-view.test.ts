import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryReputationClaimView, toPrimaryReputationClaimViews } from "./primary-reputation-claim-view.js";
import { newPrimaryReputationClaim } from "./primary-reputation-claim.js";

test("PrimaryReputationClaimView shows the status in capitals", () => {
  const item = newPrimaryReputationClaim("code-528", "title-257");
  const view = toPrimaryReputationClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryReputationClaimViews([item, item]).length, 2, "views");
});
