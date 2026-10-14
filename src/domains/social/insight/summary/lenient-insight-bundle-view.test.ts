import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientInsightBundleView, toLenientInsightBundleViews } from "./lenient-insight-bundle-view.js";
import { newLenientInsightBundle } from "./lenient-insight-bundle.js";

test("LenientInsightBundleView shows the status in capitals", () => {
  const item = newLenientInsightBundle("code-553", "name-610");
  const view = toLenientInsightBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientInsightBundleViews([item, item]).length, 2, "views");
});
