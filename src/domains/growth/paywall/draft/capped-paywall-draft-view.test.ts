import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedPaywallDraftView, toCappedPaywallDraftViews } from "./capped-paywall-draft-view.js";
import { newCappedPaywallDraft } from "./capped-paywall-draft.js";

test("CappedPaywallDraftView shows the status in capitals", () => {
  const item = newCappedPaywallDraft("code-410", "title-783");
  const view = toCappedPaywallDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedPaywallDraftViews([item, item]).length, 2, "views");
});
