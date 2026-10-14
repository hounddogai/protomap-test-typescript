import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightBundleView, toInsightBundleViews } from "./insight-bundle-view.js";
import { newInsightBundle } from "./insight-bundle.js";

test("InsightBundleView shows the status in capitals", () => {
  const item = newInsightBundle("code-451", "name-839");
  const view = toInsightBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightBundleViews([item, item]).length, 2, "views");
});
