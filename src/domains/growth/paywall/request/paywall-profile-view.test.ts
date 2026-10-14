import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallProfileView, toPaywallProfileViews } from "./paywall-profile-view.js";
import { newPaywallProfile } from "./paywall-profile.js";

test("PaywallProfileView shows the status in capitals", () => {
  const item = newPaywallProfile("code-454", "title-546");
  const view = toPaywallProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallProfileViews([item, item]).length, 2, "views");
});
