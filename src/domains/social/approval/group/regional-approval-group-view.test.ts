import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalApprovalGroupView, toRegionalApprovalGroupViews } from "./regional-approval-group-view.js";
import { newRegionalApprovalGroup } from "./regional-approval-group.js";

test("RegionalApprovalGroupView shows the status in capitals", () => {
  const item = newRegionalApprovalGroup("code-882", "label-228");
  const view = toRegionalApprovalGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalApprovalGroupViews([item, item]).length, 2, "views");
});
