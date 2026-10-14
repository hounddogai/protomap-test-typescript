import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualFrequencyManifestView, toManualFrequencyManifestViews } from "./manual-frequency-manifest-view.js";
import { newManualFrequencyManifest } from "./manual-frequency-manifest.js";

test("ManualFrequencyManifestView shows the status in capitals", () => {
  const item = newManualFrequencyManifest("code-70", "label-417");
  const view = toManualFrequencyManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualFrequencyManifestViews([item, item]).length, 2, "views");
});
