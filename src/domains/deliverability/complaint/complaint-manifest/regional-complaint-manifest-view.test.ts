import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalComplaintManifestView,
  toRegionalComplaintManifestViews,
} from "./regional-complaint-manifest-view.js";
import { newRegionalComplaintManifest } from "./regional-complaint-manifest.js";

test("RegionalComplaintManifestView shows the status in capitals", () => {
  const item = newRegionalComplaintManifest("code-247", "label-241");
  const view = toRegionalComplaintManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalComplaintManifestViews([item, item]).length, 2, "views");
});
