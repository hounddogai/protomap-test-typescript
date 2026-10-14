import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionBundleView, toConversionBundleViews } from "./conversion-bundle-view.js";
import { newConversionBundle } from "./conversion-bundle.js";

test("ConversionBundleView shows the status in capitals", () => {
  const item = newConversionBundle("code-436", "label-395");
  const view = toConversionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionBundleViews([item, item]).length, 2, "views");
});
