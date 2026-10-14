import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallManifestView, toPaywallManifestViews } from "./paywall-manifest-view.js";
import { newPaywallManifest } from "./paywall-manifest.js";

test("PaywallManifestView shows the status in capitals", () => {
  const item = newPaywallManifest("code-978", "name-803");
  const view = toPaywallManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallManifestViews([item, item]).length, 2, "views");
});
