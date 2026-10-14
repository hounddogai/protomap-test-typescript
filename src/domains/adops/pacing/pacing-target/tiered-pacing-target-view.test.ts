import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPacingTargetView, toTieredPacingTargetViews } from "./tiered-pacing-target-view.js";
import { newTieredPacingTarget } from "./tiered-pacing-target.js";

test("TieredPacingTargetView shows the status in capitals", () => {
  const item = newTieredPacingTarget("code-74", "title-802");
  const view = toTieredPacingTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPacingTargetViews([item, item]).length, 2, "views");
});
