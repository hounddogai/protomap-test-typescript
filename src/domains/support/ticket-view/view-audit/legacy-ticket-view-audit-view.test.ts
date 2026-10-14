import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyTicketViewAuditView, toLegacyTicketViewAuditViews } from "./legacy-ticket-view-audit-view.js";
import { newLegacyTicketViewAudit } from "./legacy-ticket-view-audit.js";

test("LegacyTicketViewAuditView shows the status in capitals", () => {
  const item = newLegacyTicketViewAudit("code-382", "label-937");
  const view = toLegacyTicketViewAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyTicketViewAuditViews([item, item]).length, 2, "views");
});
