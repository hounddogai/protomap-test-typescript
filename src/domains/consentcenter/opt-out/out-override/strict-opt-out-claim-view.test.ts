import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictOptOutClaimView, toStrictOptOutClaimViews } from "./strict-opt-out-claim-view.js";
import { newStrictOptOutClaim } from "./strict-opt-out-claim.js";

test("StrictOptOutClaimView shows the status in capitals", () => {
  const item = newStrictOptOutClaim("code-685", "name-509");
  const view = toStrictOptOutClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictOptOutClaimViews([item, item]).length, 2, "views");
});
