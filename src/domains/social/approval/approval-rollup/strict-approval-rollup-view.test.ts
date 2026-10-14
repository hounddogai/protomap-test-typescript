import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictApprovalRollupView, toStrictApprovalRollupViews } from "./strict-approval-rollup-view.js";
import { newStrictApprovalRollup } from "./strict-approval-rollup.js";

test("StrictApprovalRollupView shows the status in capitals", () => {
  const item = newStrictApprovalRollup("code-694", "title-563");
  const view = toStrictApprovalRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictApprovalRollupViews([item, item]).length, 2, "views");
});
