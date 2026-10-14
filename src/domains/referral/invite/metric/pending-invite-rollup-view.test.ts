import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingInviteRollupView, toPendingInviteRollupViews } from "./pending-invite-rollup-view.js";
import { newPendingInviteRollup } from "./pending-invite-rollup.js";

test("PendingInviteRollupView shows the status in capitals", () => {
  const item = newPendingInviteRollup("code-173", "title-251");
  const view = toPendingInviteRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingInviteRollupViews([item, item]).length, 2, "views");
});
