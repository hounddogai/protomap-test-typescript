import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalFlightClaimView, toGlobalFlightClaimViews } from "./global-flight-claim-view.js";
import { newGlobalFlightClaim } from "./global-flight-claim.js";

test("GlobalFlightClaimView shows the status in capitals", () => {
  const item = newGlobalFlightClaim("code-534", "name-588");
  const view = toGlobalFlightClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFlightClaimViews([item, item]).length, 2, "views");
});
