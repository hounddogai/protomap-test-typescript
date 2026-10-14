import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryInviteEstimateView, toPrimaryInviteEstimateViews } from "./primary-invite-estimate-view.js";
import { newPrimaryInviteEstimate } from "./primary-invite-estimate.js";

test("PrimaryInviteEstimateView shows the status in capitals", () => {
  const item = newPrimaryInviteEstimate("code-989", "name-16");
  const view = toPrimaryInviteEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryInviteEstimateViews([item, item]).length, 2, "views");
});
