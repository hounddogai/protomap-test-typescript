import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualInviteCheckpointView, toManualInviteCheckpointViews } from "./manual-invite-checkpoint-view.js";
import { newManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

test("ManualInviteCheckpointView shows the status in capitals", () => {
  const item = newManualInviteCheckpoint("code-722", "label-823");
  const view = toManualInviteCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualInviteCheckpointViews([item, item]).length, 2, "views");
});
