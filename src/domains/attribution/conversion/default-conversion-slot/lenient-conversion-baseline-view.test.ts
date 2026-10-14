import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientConversionBaselineView,
  toLenientConversionBaselineViews,
} from "./lenient-conversion-baseline-view.js";
import { newLenientConversionBaseline } from "./lenient-conversion-baseline.js";

test("LenientConversionBaselineView shows the status in capitals", () => {
  const item = newLenientConversionBaseline("code-842", "label-991");
  const view = toLenientConversionBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientConversionBaselineViews([item, item]).length, 2, "views");
});
