import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualMentionClaimView, toManualMentionClaimViews } from "./manual-mention-claim-view.js";
import { newManualMentionClaim } from "./manual-mention-claim.js";

test("ManualMentionClaimView shows the status in capitals", () => {
  const item = newManualMentionClaim("code-668", "name-917");
  const view = toManualMentionClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualMentionClaimViews([item, item]).length, 2, "views");
});
