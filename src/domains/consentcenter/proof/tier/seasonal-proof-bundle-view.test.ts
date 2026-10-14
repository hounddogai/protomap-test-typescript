import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalProofBundleView, toSeasonalProofBundleViews } from "./seasonal-proof-bundle-view.js";
import { newSeasonalProofBundle } from "./seasonal-proof-bundle.js";

test("SeasonalProofBundleView shows the status in capitals", () => {
  const item = newSeasonalProofBundle("code-158", "label-461");
  const view = toSeasonalProofBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalProofBundleViews([item, item]).length, 2, "views");
});
