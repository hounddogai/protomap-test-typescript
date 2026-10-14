import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictPacingRollupView, toStrictPacingRollupViews } from "./strict-pacing-rollup-view.js";
import { newStrictPacingRollup } from "./strict-pacing-rollup.js";

test("StrictPacingRollupView shows the status in capitals", () => {
  const item = newStrictPacingRollup("code-690", "title-585");
  const view = toStrictPacingRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPacingRollupViews([item, item]).length, 2, "views");
});
