import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedConversionBundleView, toBatchedConversionBundleViews } from "./batched-conversion-bundle-view.js";
import { newBatchedConversionBundle } from "./batched-conversion-bundle.js";

test("BatchedConversionBundleView shows the status in capitals", () => {
  const item = newBatchedConversionBundle("code-274", "label-86");
  const view = toBatchedConversionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedConversionBundleViews([item, item]).length, 2, "views");
});
