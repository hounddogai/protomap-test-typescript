import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofClaimView, toProofClaimViews } from "./proof-claim-view.js";
import { newProofClaim } from "./proof-claim.js";

test("ProofClaimView shows the status in capitals", () => {
  const item = newProofClaim("code-314", "label-482");
  const view = toProofClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofClaimViews([item, item]).length, 2, "views");
});
