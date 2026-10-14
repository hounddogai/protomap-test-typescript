import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteRollupView, toInviteRollupViews } from "./invite-rollup-view.js";
import { newInviteRollup } from "./invite-rollup.js";

test("InviteRollupView shows the status in capitals", () => {
  const item = newInviteRollup("code-820", "label-843");
  const view = toInviteRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteRollupViews([item, item]).length, 2, "views");
});
