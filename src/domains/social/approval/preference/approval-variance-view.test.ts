import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalVarianceView, toApprovalVarianceViews } from "./approval-variance-view.js";
import { newApprovalVariance } from "./approval-variance.js";

test("ApprovalVarianceView shows the status in capitals", () => {
  const item = newApprovalVariance("code-399", "title-201");
  const view = toApprovalVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalVarianceViews([item, item]).length, 2, "views");
});
