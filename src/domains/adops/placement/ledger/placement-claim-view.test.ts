import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementClaimView, toPlacementClaimViews } from "./placement-claim-view.js";
import { newPlacementClaim } from "./placement-claim.js";

test("PlacementClaimView shows the status in capitals", () => {
  const item = newPlacementClaim("code-392", "title-627");
  const view = toPlacementClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementClaimViews([item, item]).length, 2, "views");
});
