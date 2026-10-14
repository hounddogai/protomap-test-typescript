import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWindowBaselineView, toLegacyWindowBaselineViews } from "./legacy-window-baseline-view.js";
import { newLegacyWindowBaseline } from "./legacy-window-baseline.js";

test("LegacyWindowBaselineView shows the status in capitals", () => {
  const item = newLegacyWindowBaseline("code-688", "label-837");
  const view = toLegacyWindowBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWindowBaselineViews([item, item]).length, 2, "views");
});
