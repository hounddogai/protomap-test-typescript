import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteCheckpointView, toInviteCheckpointViews } from "./invite-checkpoint-view.js";
import { newInviteCheckpoint } from "./invite-checkpoint.js";

test("InviteCheckpointView shows the status in capitals", () => {
  const item = newInviteCheckpoint("code-191", "label-569");
  const view = toInviteCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteCheckpointViews([item, item]).length, 2, "views");
});
