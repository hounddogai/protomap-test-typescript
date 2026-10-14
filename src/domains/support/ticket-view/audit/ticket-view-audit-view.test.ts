import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewAuditView, toTicketViewAuditViews } from "./ticket-view-audit-view.js";
import { newTicketViewAudit } from "./ticket-view-audit.js";

test("TicketViewAuditView shows the status in capitals", () => {
  const item = newTicketViewAudit("code-551", "title-524");
  const view = toTicketViewAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewAuditViews([item, item]).length, 2, "views");
});
