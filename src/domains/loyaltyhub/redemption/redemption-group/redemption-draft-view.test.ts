import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionDraftView, toRedemptionDraftViews } from "./redemption-draft-view.js";
import { newRedemptionDraft } from "./redemption-draft.js";

test("RedemptionDraftView shows the status in capitals", () => {
  const item = newRedemptionDraft("code-711", "name-93");
  const view = toRedemptionDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionDraftViews([item, item]).length, 2, "views");
});
