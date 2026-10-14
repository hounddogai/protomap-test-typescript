import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingThresholdView, toPacingThresholdViews } from "./pacing-threshold-view.js";
import { newPacingThreshold } from "./pacing-threshold.js";

test("PacingThresholdView shows the status in capitals", () => {
  const item = newPacingThreshold("code-427", "name-537");
  const view = toPacingThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingThresholdViews([item, item]).length, 2, "views");
});
