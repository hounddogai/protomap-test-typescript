import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierDraftView, toTierDraftViews } from "./tier-draft-view.js";
import { newTierDraft } from "./tier-draft.js";

test("TierDraftView shows the status in capitals", () => {
  const item = newTierDraft("code-814", "name-842");
  const view = toTierDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierDraftViews([item, item]).length, 2, "views");
});
