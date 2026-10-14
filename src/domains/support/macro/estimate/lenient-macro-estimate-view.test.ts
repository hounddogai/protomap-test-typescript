import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientMacroEstimateView, toLenientMacroEstimateViews } from "./lenient-macro-estimate-view.js";
import { newLenientMacroEstimate } from "./lenient-macro-estimate.js";

test("LenientMacroEstimateView shows the status in capitals", () => {
  const item = newLenientMacroEstimate("code-755", "name-609");
  const view = toLenientMacroEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientMacroEstimateViews([item, item]).length, 2, "views");
});
