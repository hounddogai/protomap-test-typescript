import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingSubscriptionManifestView,
  toPendingSubscriptionManifestViews,
} from "./pending-subscription-manifest-view.js";
import { newPendingSubscriptionManifest } from "./pending-subscription-manifest.js";

test("PendingSubscriptionManifestView shows the status in capitals", () => {
  const item = newPendingSubscriptionManifest("code-791", "title-621");
  const view = toPendingSubscriptionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSubscriptionManifestViews([item, item]).length, 2, "views");
});
