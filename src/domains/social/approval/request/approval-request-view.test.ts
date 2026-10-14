import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalRequestView, toApprovalRequestViews } from "./approval-request-view.js";
import { newApprovalRequest } from "./approval-request.js";

test("ApprovalRequestView shows the status in capitals", () => {
  const item = newApprovalRequest("code-272", "name-815");
  const view = toApprovalRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalRequestViews([item, item]).length, 2, "views");
});
