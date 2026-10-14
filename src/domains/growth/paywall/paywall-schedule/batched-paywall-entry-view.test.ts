import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPaywallEntryView, toBatchedPaywallEntryViews } from "./batched-paywall-entry-view.js";
import { newBatchedPaywallEntry } from "./batched-paywall-entry.js";

test("BatchedPaywallEntryView shows the status in capitals", () => {
  const item = newBatchedPaywallEntry("code-708", "name-15");
  const view = toBatchedPaywallEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPaywallEntryViews([item, item]).length, 2, "views");
});
