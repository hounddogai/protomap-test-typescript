import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderClaimView, toSenderClaimViews } from "./sender-claim-view.js";
import { newSenderClaim } from "./sender-claim.js";

test("SenderClaimView shows the status in capitals", () => {
  const item = newSenderClaim("code-295", "title-624");
  const view = toSenderClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderClaimViews([item, item]).length, 2, "views");
});
