import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPayoutManifestView, toPrimaryPayoutManifestViews } from "./primary-payout-manifest-view.js";
import { newPrimaryPayoutManifest } from "./primary-payout-manifest.js";

test("PrimaryPayoutManifestView shows the status in capitals", () => {
  const item = newPrimaryPayoutManifest("code-144", "name-165");
  const view = toPrimaryPayoutManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPayoutManifestViews([item, item]).length, 2, "views");
});
