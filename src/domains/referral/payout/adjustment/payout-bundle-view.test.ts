import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutBundleView, toPayoutBundleViews } from "./payout-bundle-view.js";
import { newPayoutBundle } from "./payout-bundle.js";

test("PayoutBundleView shows the status in capitals", () => {
  const item = newPayoutBundle("code-856", "label-68");
  const view = toPayoutBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutBundleViews([item, item]).length, 2, "views");
});
