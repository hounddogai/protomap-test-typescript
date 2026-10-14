import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyManifestView, toFrequencyManifestViews } from "./frequency-manifest-view.js";
import { newFrequencyManifest } from "./frequency-manifest.js";

test("FrequencyManifestView shows the status in capitals", () => {
  const item = newFrequencyManifest("code-221", "title-19");
  const view = toFrequencyManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyManifestViews([item, item]).length, 2, "views");
});
