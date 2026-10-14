import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeCycleView, toCreativeCycleViews } from "./creative-cycle-view.js";
import { newCreativeCycle } from "./creative-cycle.js";

test("CreativeCycleView shows the status in capitals", () => {
  const item = newCreativeCycle("code-567", "name-906");
  const view = toCreativeCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeCycleViews([item, item]).length, 2, "views");
});
