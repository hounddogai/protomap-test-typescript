import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptivePacingBaselineView, toAdaptivePacingBaselineViews } from "./adaptive-pacing-baseline-view.js";
import { newAdaptivePacingBaseline } from "./adaptive-pacing-baseline.js";

test("AdaptivePacingBaselineView shows the status in capitals", () => {
  const item = newAdaptivePacingBaseline("code-702", "title-812");
  const view = toAdaptivePacingBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptivePacingBaselineViews([item, item]).length, 2, "views");
});
