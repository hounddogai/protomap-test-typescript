import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutClaimView, toPayoutClaimViews } from "./payout-claim-view.js";
import { newPayoutClaim } from "./payout-claim.js";

test("PayoutClaimView shows the status in capitals", () => {
  const item = newPayoutClaim("code-583", "label-738");
  const view = toPayoutClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutClaimViews([item, item]).length, 2, "views");
});
