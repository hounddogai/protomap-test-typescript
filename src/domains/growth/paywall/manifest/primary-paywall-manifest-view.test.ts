import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPaywallManifestView, toPrimaryPaywallManifestViews } from "./primary-paywall-manifest-view.js";
import { newPrimaryPaywallManifest } from "./primary-paywall-manifest.js";

test("PrimaryPaywallManifestView shows the status in capitals", () => {
  const item = newPrimaryPaywallManifest("code-716", "label-134");
  const view = toPrimaryPaywallManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPaywallManifestViews([item, item]).length, 2, "views");
});
