import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientRewardAuditView, toLenientRewardAuditViews } from "./lenient-reward-audit-view.js";
import { newLenientRewardAudit } from "./lenient-reward-audit.js";

test("LenientRewardAuditView shows the status in capitals", () => {
  const item = newLenientRewardAudit("code-277", "name-15");
  const view = toLenientRewardAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientRewardAuditViews([item, item]).length, 2, "views");
});
