import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCreativeCycleView, toStrictCreativeCycleViews } from "./strict-creative-cycle-view.js";
import { newStrictCreativeCycle } from "./strict-creative-cycle.js";

test("StrictCreativeCycleView shows the status in capitals", () => {
  const item = newStrictCreativeCycle("code-891", "title-516");
  const view = toStrictCreativeCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCreativeCycleViews([item, item]).length, 2, "views");
});
