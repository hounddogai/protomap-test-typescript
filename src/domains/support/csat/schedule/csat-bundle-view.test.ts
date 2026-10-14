import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatBundleView, toCsatBundleViews } from "./csat-bundle-view.js";
import { newCsatBundle } from "./csat-bundle.js";

test("CsatBundleView shows the status in capitals", () => {
  const item = newCsatBundle("code-250", "title-530");
  const view = toCsatBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatBundleViews([item, item]).length, 2, "views");
});
