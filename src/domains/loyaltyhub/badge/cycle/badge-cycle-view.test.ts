import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeCycleView, toBadgeCycleViews } from "./badge-cycle-view.js";
import { newBadgeCycle } from "./badge-cycle.js";

test("BadgeCycleView shows the status in capitals", () => {
  const item = newBadgeCycle("code-162", "label-40");
  const view = toBadgeCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeCycleViews([item, item]).length, 2, "views");
});
