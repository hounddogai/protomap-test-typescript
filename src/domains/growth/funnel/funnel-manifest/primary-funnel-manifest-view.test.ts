import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFunnelManifestView, toPrimaryFunnelManifestViews } from "./primary-funnel-manifest-view.js";
import { newPrimaryFunnelManifest } from "./primary-funnel-manifest.js";

test("PrimaryFunnelManifestView shows the status in capitals", () => {
  const item = newPrimaryFunnelManifest("code-62", "label-148");
  const view = toPrimaryFunnelManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFunnelManifestViews([item, item]).length, 2, "views");
});
