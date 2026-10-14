import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyInviteRollupView, toLegacyInviteRollupViews } from "./legacy-invite-rollup-view.js";
import { newLegacyInviteRollup } from "./legacy-invite-rollup.js";

test("LegacyInviteRollupView shows the status in capitals", () => {
  const item = newLegacyInviteRollup("code-781", "title-573");
  const view = toLegacyInviteRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyInviteRollupViews([item, item]).length, 2, "views");
});
