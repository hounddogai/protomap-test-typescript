import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteCycleView, toInviteCycleViews } from "./invite-cycle-view.js";
import { newInviteCycle } from "./invite-cycle.js";

test("InviteCycleView shows the status in capitals", () => {
  const item = newInviteCycle("code-192", "label-915");
  const view = toInviteCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteCycleViews([item, item]).length, 2, "views");
});
