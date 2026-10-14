import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightManifestView, toFlightManifestViews } from "./flight-manifest-view.js";
import { newFlightManifest } from "./flight-manifest.js";

test("FlightManifestView shows the status in capitals", () => {
  const item = newFlightManifest("code-358", "label-858");
  const view = toFlightManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightManifestViews([item, item]).length, 2, "views");
});
