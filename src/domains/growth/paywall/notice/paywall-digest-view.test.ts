import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallDigestView, toPaywallDigestViews } from "./paywall-digest-view.js";
import { newPaywallDigest } from "./paywall-digest.js";

test("PaywallDigestView shows the status in capitals", () => {
  const item = newPaywallDigest("code-477", "label-705");
  const view = toPaywallDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallDigestViews([item, item]).length, 2, "views");
});
