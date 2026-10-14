import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatManifestView, toCsatManifestViews } from "./csat-manifest-view.js";
import { newCsatManifest } from "./csat-manifest.js";

test("CsatManifestView shows the status in capitals", () => {
  const item = newCsatManifest("code-17", "label-749");
  const view = toCsatManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatManifestViews([item, item]).length, 2, "views");
});
