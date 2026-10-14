import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingLevelAllocationView, toRollingLevelAllocationViews } from "./rolling-level-allocation-view.js";
import { newRollingLevelAllocation } from "./rolling-level-allocation.js";

test("RollingLevelAllocationView shows the status in capitals", () => {
  const item = newRollingLevelAllocation("code-121", "title-159");
  const view = toRollingLevelAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingLevelAllocationViews([item, item]).length, 2, "views");
});
