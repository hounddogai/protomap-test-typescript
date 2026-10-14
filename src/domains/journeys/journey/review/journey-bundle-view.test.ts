import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyBundleView, toJourneyBundleViews } from "./journey-bundle-view.js";
import { newJourneyBundle } from "./journey-bundle.js";

test("JourneyBundleView shows the status in capitals", () => {
  const item = newJourneyBundle("code-267", "name-268");
  const view = toJourneyBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyBundleViews([item, item]).length, 2, "views");
});
