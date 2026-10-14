import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalMappingView, toApprovalMappingViews } from "./approval-mapping-view.js";
import { newApprovalMapping } from "./approval-mapping.js";

test("ApprovalMappingView shows the status in capitals", () => {
  const item = newApprovalMapping("code-446", "label-888");
  const view = toApprovalMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalMappingViews([item, item]).length, 2, "views");
});
