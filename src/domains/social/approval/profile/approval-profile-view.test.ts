import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalProfileView, toApprovalProfileViews } from "./approval-profile-view.js";
import { newApprovalProfile } from "./approval-profile.js";

test("ApprovalProfileView shows the status in capitals", () => {
  const item = newApprovalProfile("code-833", "label-946");
  const view = toApprovalProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalProfileViews([item, item]).length, 2, "views");
});
