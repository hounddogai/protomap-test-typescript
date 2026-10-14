import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingRollupView, toPacingRollupViews } from "./pacing-rollup-view.js";
import { newPacingRollup } from "./pacing-rollup.js";

test("PacingRollupView shows the status in capitals", () => {
  const item = newPacingRollup("code-424", "title-127");
  const view = toPacingRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingRollupViews([item, item]).length, 2, "views");
});
