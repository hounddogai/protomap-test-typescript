import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredTicketViewClaimView, toTieredTicketViewClaimViews } from "./tiered-ticket-view-claim-view.js";
import { newTieredTicketViewClaim } from "./tiered-ticket-view-claim.js";

test("TieredTicketViewClaimView shows the status in capitals", () => {
  const item = newTieredTicketViewClaim("code-256", "title-653");
  const view = toTieredTicketViewClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredTicketViewClaimViews([item, item]).length, 2, "views");
});
