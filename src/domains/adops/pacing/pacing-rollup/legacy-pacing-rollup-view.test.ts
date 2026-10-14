import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPacingRollupView, toLegacyPacingRollupViews } from "./legacy-pacing-rollup-view.js";
import { newLegacyPacingRollup } from "./legacy-pacing-rollup.js";

test("LegacyPacingRollupView shows the status in capitals", () => {
  const item = newLegacyPacingRollup("code-326", "label-531");
  const view = toLegacyPacingRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPacingRollupViews([item, item]).length, 2, "views");
});
