import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionGroupView, toSubscriptionGroupViews } from "./subscription-group-view.js";
import { newSubscriptionGroup } from "./subscription-group.js";

test("SubscriptionGroupView shows the status in capitals", () => {
  const item = newSubscriptionGroup("code-196", "title-471");
  const view = toSubscriptionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionGroupViews([item, item]).length, 2, "views");
});
