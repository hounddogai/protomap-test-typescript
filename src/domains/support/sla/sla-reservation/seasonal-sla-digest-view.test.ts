import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalSlaDigestView, toSeasonalSlaDigestViews } from "./seasonal-sla-digest-view.js";
import { newSeasonalSlaDigest } from "./seasonal-sla-digest.js";

test("SeasonalSlaDigestView shows the status in capitals", () => {
  const item = newSeasonalSlaDigest("code-268", "name-525");
  const view = toSeasonalSlaDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSlaDigestViews([item, item]).length, 2, "views");
});
