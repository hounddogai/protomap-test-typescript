import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallEntryView, toPaywallEntryViews } from "./paywall-entry-view.js";
import { newPaywallEntry } from "./paywall-entry.js";

test("PaywallEntryView shows the status in capitals", () => {
  const item = newPaywallEntry("code-838", "name-593");
  const view = toPaywallEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallEntryViews([item, item]).length, 2, "views");
});
