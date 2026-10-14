import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalSlaPlanView, toGlobalSlaPlanViews } from "./global-sla-plan-view.js";
import { newGlobalSlaPlan } from "./global-sla-plan.js";

test("GlobalSlaPlanView shows the status in capitals", () => {
  const item = newGlobalSlaPlan("code-207", "label-614");
  const view = toGlobalSlaPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalSlaPlanViews([item, item]).length, 2, "views");
});
