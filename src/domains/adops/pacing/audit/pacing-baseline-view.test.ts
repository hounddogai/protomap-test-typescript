import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingBaselineView, toPacingBaselineViews } from "./pacing-baseline-view.js";
import { newPacingBaseline } from "./pacing-baseline.js";

test("PacingBaselineView shows the status in capitals", () => {
  const item = newPacingBaseline("code-946", "title-306");
  const view = toPacingBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingBaselineViews([item, item]).length, 2, "views");
});
