import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingApprovalProfileView, toRollingApprovalProfileViews } from "./rolling-approval-profile-view.js";
import { newRollingApprovalProfile } from "./rolling-approval-profile.js";

test("RollingApprovalProfileView shows the status in capitals", () => {
  const item = newRollingApprovalProfile("code-379", "label-740");
  const view = toRollingApprovalProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingApprovalProfileViews([item, item]).length, 2, "views");
});
