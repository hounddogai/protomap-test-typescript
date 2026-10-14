import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyFraudCheckBundleView, toLegacyFraudCheckBundleViews } from "./legacy-fraud-check-bundle-view.js";
import { newLegacyFraudCheckBundle } from "./legacy-fraud-check-bundle.js";

test("LegacyFraudCheckBundleView shows the status in capitals", () => {
  const item = newLegacyFraudCheckBundle("code-68", "title-604");
  const view = toLegacyFraudCheckBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyFraudCheckBundleViews([item, item]).length, 2, "views");
});
