import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchClaimView, toBranchClaimViews } from "./branch-claim-view.js";
import { newBranchClaim } from "./branch-claim.js";

test("BranchClaimView shows the status in capitals", () => {
  const item = newBranchClaim("code-380", "name-928");
  const view = toBranchClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchClaimViews([item, item]).length, 2, "views");
});
