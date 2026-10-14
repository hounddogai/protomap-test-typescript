import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyRedemptionDigestView, toLegacyRedemptionDigestViews } from "./legacy-redemption-digest-view.js";
import { newLegacyRedemptionDigest } from "./legacy-redemption-digest.js";

test("LegacyRedemptionDigestView shows the status in capitals", () => {
  const item = newLegacyRedemptionDigest("code-306", "label-678");
  const view = toLegacyRedemptionDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyRedemptionDigestViews([item, item]).length, 2, "views");
});
