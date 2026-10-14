import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelManifestView, toFunnelManifestViews } from "./funnel-manifest-view.js";
import { newFunnelManifest } from "./funnel-manifest.js";

test("FunnelManifestView shows the status in capitals", () => {
  const item = newFunnelManifest("code-399", "label-262");
  const view = toFunnelManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelManifestViews([item, item]).length, 2, "views");
});
