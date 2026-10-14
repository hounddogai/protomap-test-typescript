import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionProfileView, toSubscriptionProfileViews } from "./subscription-profile-view.js";
import { newSubscriptionProfile } from "./subscription-profile.js";

test("SubscriptionProfileView shows the status in capitals", () => {
  const item = newSubscriptionProfile("code-429", "name-596");
  const view = toSubscriptionProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionProfileViews([item, item]).length, 2, "views");
});
