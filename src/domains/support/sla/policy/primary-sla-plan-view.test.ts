import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySlaPlanView, toPrimarySlaPlanViews } from "./primary-sla-plan-view.js";
import { newPrimarySlaPlan } from "./primary-sla-plan.js";

test("PrimarySlaPlanView shows the status in capitals", () => {
  const item = newPrimarySlaPlan("code-409", "name-505");
  const view = toPrimarySlaPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySlaPlanViews([item, item]).length, 2, "views");
});
