import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalRedemptionBundleView, toGlobalRedemptionBundleViews } from "./global-redemption-bundle-view.js";
import { newGlobalRedemptionBundle } from "./global-redemption-bundle.js";

test("GlobalRedemptionBundleView shows the status in capitals", () => {
  const item = newGlobalRedemptionBundle("code-445", "label-547");
  const view = toGlobalRedemptionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRedemptionBundleViews([item, item]).length, 2, "views");
});
