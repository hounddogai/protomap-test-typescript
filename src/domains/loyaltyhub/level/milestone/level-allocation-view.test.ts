import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelAllocationView, toLevelAllocationViews } from "./level-allocation-view.js";
import { newLevelAllocation } from "./level-allocation.js";

test("LevelAllocationView shows the status in capitals", () => {
  const item = newLevelAllocation("code-786", "title-804");
  const view = toLevelAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelAllocationViews([item, item]).length, 2, "views");
});
