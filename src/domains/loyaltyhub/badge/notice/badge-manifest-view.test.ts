import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeManifestView, toBadgeManifestViews } from "./badge-manifest-view.js";
import { newBadgeManifest } from "./badge-manifest.js";

test("BadgeManifestView shows the status in capitals", () => {
  const item = newBadgeManifest("code-331", "name-630");
  const view = toBadgeManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeManifestViews([item, item]).length, 2, "views");
});
