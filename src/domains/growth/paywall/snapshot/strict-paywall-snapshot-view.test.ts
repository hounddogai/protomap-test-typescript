import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictPaywallSnapshotView, toStrictPaywallSnapshotViews } from "./strict-paywall-snapshot-view.js";
import { newStrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

test("StrictPaywallSnapshotView shows the status in capitals", () => {
  const item = newStrictPaywallSnapshot("code-565", "title-914");
  const view = toStrictPaywallSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPaywallSnapshotViews([item, item]).length, 2, "views");
});
