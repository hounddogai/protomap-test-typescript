import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPaywallSnapshotView, toRegionalPaywallSnapshotViews } from "./regional-paywall-snapshot-view.js";
import { newRegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

test("RegionalPaywallSnapshotView shows the status in capitals", () => {
  const item = newRegionalPaywallSnapshot("code-84", "label-728");
  const view = toRegionalPaywallSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPaywallSnapshotViews([item, item]).length, 2, "views");
});
