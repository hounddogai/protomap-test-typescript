import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredJourneyDigestView, toTieredJourneyDigestViews } from "./tiered-journey-digest-view.js";
import { newTieredJourneyDigest } from "./tiered-journey-digest.js";

test("TieredJourneyDigestView shows the status in capitals", () => {
  const item = newTieredJourneyDigest("code-783", "label-480");
  const view = toTieredJourneyDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredJourneyDigestViews([item, item]).length, 2, "views");
});
