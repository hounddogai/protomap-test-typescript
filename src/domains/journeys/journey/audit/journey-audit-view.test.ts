import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyAuditView, toJourneyAuditViews } from "./journey-audit-view.js";
import { newJourneyAudit } from "./journey-audit.js";

test("JourneyAuditView shows the status in capitals", () => {
  const item = newJourneyAudit("code-959", "name-834");
  const view = toJourneyAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyAuditViews([item, item]).length, 2, "views");
});
