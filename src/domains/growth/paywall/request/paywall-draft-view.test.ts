import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallDraftView, toPaywallDraftViews } from "./paywall-draft-view.js";
import { newPaywallDraft } from "./paywall-draft.js";

test("PaywallDraftView shows the status in capitals", () => {
  const item = newPaywallDraft("code-603", "name-339");
  const view = toPaywallDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallDraftViews([item, item]).length, 2, "views");
});
