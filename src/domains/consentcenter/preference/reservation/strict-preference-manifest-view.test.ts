import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictPreferenceManifestView,
  toStrictPreferenceManifestViews,
} from "./strict-preference-manifest-view.js";
import { newStrictPreferenceManifest } from "./strict-preference-manifest.js";

test("StrictPreferenceManifestView shows the status in capitals", () => {
  const item = newStrictPreferenceManifest("code-247", "title-410");
  const view = toStrictPreferenceManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPreferenceManifestViews([item, item]).length, 2, "views");
});
