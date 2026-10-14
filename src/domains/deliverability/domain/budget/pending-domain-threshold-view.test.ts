import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingDomainThresholdView, toPendingDomainThresholdViews } from "./pending-domain-threshold-view.js";
import { newPendingDomainThreshold } from "./pending-domain-threshold.js";

test("PendingDomainThresholdView shows the status in capitals", () => {
  const item = newPendingDomainThreshold("code-836", "name-539");
  const view = toPendingDomainThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingDomainThresholdViews([item, item]).length, 2, "views");
});
