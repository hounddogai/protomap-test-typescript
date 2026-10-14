import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveTicketViewClaimView, toAdaptiveTicketViewClaimViews } from "./adaptive-ticket-view-claim-view.js";
import { newAdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

test("AdaptiveTicketViewClaimView shows the status in capitals", () => {
  const item = newAdaptiveTicketViewClaim("code-596", "label-607");
  const view = toAdaptiveTicketViewClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveTicketViewClaimViews([item, item]).length, 2, "views");
});
