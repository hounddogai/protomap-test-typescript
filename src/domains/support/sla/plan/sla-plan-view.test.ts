import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaPlanView, toSlaPlanViews } from "./sla-plan-view.js";
import { newSlaPlan } from "./sla-plan.js";

test("SlaPlanView shows the status in capitals", () => {
  const item = newSlaPlan("code-228", "title-72");
  const view = toSlaPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaPlanViews([item, item]).length, 2, "views");
});
