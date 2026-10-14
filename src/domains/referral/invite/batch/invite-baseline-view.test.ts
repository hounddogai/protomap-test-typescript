import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteBaselineView, toInviteBaselineViews } from "./invite-baseline-view.js";
import { newInviteBaseline } from "./invite-baseline.js";

test("InviteBaselineView shows the status in capitals", () => {
  const item = newInviteBaseline("code-218", "label-576");
  const view = toInviteBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteBaselineViews([item, item]).length, 2, "views");
});
