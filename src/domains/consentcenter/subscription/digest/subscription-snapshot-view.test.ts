import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionSnapshotView, toSubscriptionSnapshotViews } from "./subscription-snapshot-view.js";
import { newSubscriptionSnapshot } from "./subscription-snapshot.js";

test("SubscriptionSnapshotView shows the status in capitals", () => {
  const item = newSubscriptionSnapshot("code-649", "name-803");
  const view = toSubscriptionSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionSnapshotViews([item, item]).length, 2, "views");
});
