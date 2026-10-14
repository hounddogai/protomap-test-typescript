import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedMacroEstimateView, toCappedMacroEstimateViews } from "./capped-macro-estimate-view.js";
import { newCappedMacroEstimate } from "./capped-macro-estimate.js";

test("CappedMacroEstimateView shows the status in capitals", () => {
  const item = newCappedMacroEstimate("code-861", "label-856");
  const view = toCappedMacroEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedMacroEstimateViews([item, item]).length, 2, "views");
});
