import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingSenderClaimView, toRollingSenderClaimViews } from "./rolling-sender-claim-view.js";
import { newRollingSenderClaim } from "./rolling-sender-claim.js";

test("RollingSenderClaimView shows the status in capitals", () => {
  const item = newRollingSenderClaim("code-546", "title-924");
  const view = toRollingSenderClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSenderClaimViews([item, item]).length, 2, "views");
});
