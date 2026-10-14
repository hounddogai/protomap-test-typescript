import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientPaywallEntryView, toLenientPaywallEntryViews } from "./lenient-paywall-entry-view.js";
import { newLenientPaywallEntry } from "./lenient-paywall-entry.js";

test("LenientPaywallEntryView shows the status in capitals", () => {
  const item = newLenientPaywallEntry("code-433", "title-18");
  const view = toLenientPaywallEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientPaywallEntryViews([item, item]).length, 2, "views");
});
