import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualTicketViewAgreementView,
  toManualTicketViewAgreementViews,
} from "./manual-ticket-view-agreement-view.js";
import { newManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

test("ManualTicketViewAgreementView shows the status in capitals", () => {
  const item = newManualTicketViewAgreement("code-103", "title-347");
  const view = toManualTicketViewAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTicketViewAgreementViews([item, item]).length, 2, "views");
});
