import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingSubscriptionSnapshotView,
  toPendingSubscriptionSnapshotViews,
} from "./pending-subscription-snapshot-view.js";
import { newPendingSubscriptionSnapshot } from "./pending-subscription-snapshot.js";

test("PendingSubscriptionSnapshotView shows the status in capitals", () => {
  const item = newPendingSubscriptionSnapshot("code-473", "title-635");
  const view = toPendingSubscriptionSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSubscriptionSnapshotViews([item, item]).length, 2, "views");
});
