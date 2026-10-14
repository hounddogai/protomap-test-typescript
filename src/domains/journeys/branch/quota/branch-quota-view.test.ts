import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchQuotaView, toBranchQuotaViews } from "./branch-quota-view.js";
import { newBranchQuota } from "./branch-quota.js";

test("BranchQuotaView shows the status in capitals", () => {
  const item = newBranchQuota("code-736", "title-952");
  const view = toBranchQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchQuotaViews([item, item]).length, 2, "views");
});
