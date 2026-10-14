import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalFlightTierView, toGlobalFlightTierViews } from "./global-flight-tier-view.js";
import { newGlobalFlightTier } from "./global-flight-tier.js";

test("GlobalFlightTierView shows the status in capitals", () => {
  const item = newGlobalFlightTier("code-843", "name-387");
  const view = toGlobalFlightTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFlightTierViews([item, item]).length, 2, "views");
});
