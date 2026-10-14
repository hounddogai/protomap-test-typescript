import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationClaimView, toReputationClaimViews } from "./reputation-claim-view.js";
import { newReputationClaim } from "./reputation-claim.js";

test("ReputationClaimView shows the status in capitals", () => {
  const item = newReputationClaim("code-368", "label-986");
  const view = toReputationClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationClaimViews([item, item]).length, 2, "views");
});
