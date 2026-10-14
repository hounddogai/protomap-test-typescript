import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyInviteBatchView, toLegacyInviteBatchViews } from "./legacy-invite-batch-view.js";
import { newLegacyInviteBatch } from "./legacy-invite-batch.js";

test("LegacyInviteBatchView shows the status in capitals", () => {
  const item = newLegacyInviteBatch("code-716", "name-142");
  const view = toLegacyInviteBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyInviteBatchViews([item, item]).length, 2, "views");
});
