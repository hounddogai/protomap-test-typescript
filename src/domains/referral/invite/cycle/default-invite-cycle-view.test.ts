import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultInviteCycleView, toDefaultInviteCycleViews } from "./default-invite-cycle-view.js";
import { newDefaultInviteCycle } from "./default-invite-cycle.js";

test("DefaultInviteCycleView shows the status in capitals", () => {
  const item = newDefaultInviteCycle("code-15", "label-117");
  const view = toDefaultInviteCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultInviteCycleViews([item, item]).length, 2, "views");
});
