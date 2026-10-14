import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPayoutBundleView, toLegacyPayoutBundleViews } from "./legacy-payout-bundle-view.js";
import { newLegacyPayoutBundle } from "./legacy-payout-bundle.js";

test("LegacyPayoutBundleView shows the status in capitals", () => {
  const item = newLegacyPayoutBundle("code-904", "label-718");
  const view = toLegacyPayoutBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPayoutBundleViews([item, item]).length, 2, "views");
});
