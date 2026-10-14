import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionDigestView, toSubscriptionDigestViews } from "./subscription-digest-view.js";
import { newSubscriptionDigest } from "./subscription-digest.js";

test("SubscriptionDigestView shows the status in capitals", () => {
  const item = newSubscriptionDigest("code-640", "name-286");
  const view = toSubscriptionDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionDigestViews([item, item]).length, 2, "views");
});
