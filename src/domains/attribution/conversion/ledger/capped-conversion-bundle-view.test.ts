import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedConversionBundleView, toCappedConversionBundleViews } from "./capped-conversion-bundle-view.js";
import { newCappedConversionBundle } from "./capped-conversion-bundle.js";

test("CappedConversionBundleView shows the status in capitals", () => {
  const item = newCappedConversionBundle("code-24", "label-562");
  const view = toCappedConversionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedConversionBundleViews([item, item]).length, 2, "views");
});
