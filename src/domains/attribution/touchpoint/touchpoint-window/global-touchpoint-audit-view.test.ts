import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalTouchpointAuditView, toGlobalTouchpointAuditViews } from "./global-touchpoint-audit-view.js";
import { newGlobalTouchpointAudit } from "./global-touchpoint-audit.js";

test("GlobalTouchpointAuditView shows the status in capitals", () => {
  const item = newGlobalTouchpointAudit("code-916", "name-383");
  const view = toGlobalTouchpointAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalTouchpointAuditViews([item, item]).length, 2, "views");
});
