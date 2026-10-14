import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalBadgeManifestView, toSeasonalBadgeManifestViews } from "./seasonal-badge-manifest-view.js";
import { newSeasonalBadgeManifest } from "./seasonal-badge-manifest.js";

test("SeasonalBadgeManifestView shows the status in capitals", () => {
  const item = newSeasonalBadgeManifest("code-470", "title-322");
  const view = toSeasonalBadgeManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalBadgeManifestViews([item, item]).length, 2, "views");
});
