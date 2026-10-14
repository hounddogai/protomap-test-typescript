import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationAuditView, toActivationAuditViews } from "./activation-audit-view.js";
import { newActivationAudit } from "./activation-audit.js";

test("ActivationAuditView shows the status in capitals", () => {
  const item = newActivationAudit("code-46", "title-527");
  const view = toActivationAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationAuditViews([item, item]).length, 2, "views");
});
