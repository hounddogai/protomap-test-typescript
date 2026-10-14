import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toCappedDeflectionManifestView,
  toCappedDeflectionManifestViews,
} from "./capped-deflection-manifest-view.js";
import { newCappedDeflectionManifest } from "./capped-deflection-manifest.js";

test("CappedDeflectionManifestView shows the status in capitals", () => {
  const item = newCappedDeflectionManifest("code-736", "title-917");
  const view = toCappedDeflectionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedDeflectionManifestViews([item, item]).length, 2, "views");
});
