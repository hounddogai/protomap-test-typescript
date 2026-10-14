import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionManifestView, toRedemptionManifestViews } from "./redemption-manifest-view.js";
import { newRedemptionManifest } from "./redemption-manifest.js";

test("RedemptionManifestView shows the status in capitals", () => {
  const item = newRedemptionManifest("code-445", "title-368");
  const view = toRedemptionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionManifestViews([item, item]).length, 2, "views");
});
