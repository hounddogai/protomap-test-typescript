import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceCycleView, toBounceCycleViews } from "./bounce-cycle-view.js";
import { newBounceCycle } from "./bounce-cycle.js";

test("BounceCycleView shows the status in capitals", () => {
  const item = newBounceCycle("code-115", "label-180");
  const view = toBounceCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceCycleViews([item, item]).length, 2, "views");
});
