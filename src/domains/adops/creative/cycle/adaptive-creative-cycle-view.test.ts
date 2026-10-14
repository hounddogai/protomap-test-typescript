import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCreativeCycleView, toAdaptiveCreativeCycleViews } from "./adaptive-creative-cycle-view.js";
import { newAdaptiveCreativeCycle } from "./adaptive-creative-cycle.js";

test("AdaptiveCreativeCycleView shows the status in capitals", () => {
  const item = newAdaptiveCreativeCycle("code-990", "name-762");
  const view = toAdaptiveCreativeCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCreativeCycleViews([item, item]).length, 2, "views");
});
