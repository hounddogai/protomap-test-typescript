import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalPayoutDraftView, toGlobalPayoutDraftViews } from "./global-payout-draft-view.js";
import { newGlobalPayoutDraft } from "./global-payout-draft.js";

test("GlobalPayoutDraftView shows the status in capitals", () => {
  const item = newGlobalPayoutDraft("code-389", "title-900");
  const view = toGlobalPayoutDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalPayoutDraftViews([item, item]).length, 2, "views");
});
