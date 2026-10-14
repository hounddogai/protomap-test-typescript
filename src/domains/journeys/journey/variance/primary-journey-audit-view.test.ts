import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryJourneyAuditView, toPrimaryJourneyAuditViews } from "./primary-journey-audit-view.js";
import { newPrimaryJourneyAudit } from "./primary-journey-audit.js";

test("PrimaryJourneyAuditView shows the status in capitals", () => {
  const item = newPrimaryJourneyAudit("code-49", "label-777");
  const view = toPrimaryJourneyAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryJourneyAuditViews([item, item]).length, 2, "views");
});
