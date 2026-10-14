import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedTicketViewAgreementView,
  toWeightedTicketViewAgreementViews,
} from "./weighted-ticket-view-agreement-view.js";
import { newWeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

test("WeightedTicketViewAgreementView shows the status in capitals", () => {
  const item = newWeightedTicketViewAgreement("code-237", "title-363");
  const view = toWeightedTicketViewAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedTicketViewAgreementViews([item, item]).length, 2, "views");
});
