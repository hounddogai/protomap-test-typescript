import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightClaimView, toFlightClaimViews } from "./flight-claim-view.js";
import { newFlightClaim } from "./flight-claim.js";

test("FlightClaimView shows the status in capitals", () => {
  const item = newFlightClaim("code-901", "title-442");
  const view = toFlightClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightClaimViews([item, item]).length, 2, "views");
});
