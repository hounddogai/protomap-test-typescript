import assert from "node:assert/strict";
import { test } from "node:test";
import { toBouncePlanView, toBouncePlanViews } from "./bounce-plan-view.js";
import { newBouncePlan } from "./bounce-plan.js";

test("BouncePlanView shows the status in capitals", () => {
  const item = newBouncePlan("code-472", "name-693");
  const view = toBouncePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBouncePlanViews([item, item]).length, 2, "views");
});
