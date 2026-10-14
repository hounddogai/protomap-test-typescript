import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalComplaintCycleView, toGlobalComplaintCycleViews } from "./global-complaint-cycle-view.js";
import { newGlobalComplaintCycle } from "./global-complaint-cycle.js";

test("GlobalComplaintCycleView shows the status in capitals", () => {
  const item = newGlobalComplaintCycle("code-656", "name-178");
  const view = toGlobalComplaintCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalComplaintCycleViews([item, item]).length, 2, "views");
});
