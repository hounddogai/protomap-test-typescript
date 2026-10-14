import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualSlaPlanView, toManualSlaPlanViews } from "./manual-sla-plan-view.js";
import { newManualSlaPlan } from "./manual-sla-plan.js";

test("ManualSlaPlanView shows the status in capitals", () => {
  const item = newManualSlaPlan("code-770", "label-314");
  const view = toManualSlaPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualSlaPlanViews([item, item]).length, 2, "views");
});
