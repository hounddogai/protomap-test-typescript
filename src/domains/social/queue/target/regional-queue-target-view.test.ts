import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalQueueTargetView, toRegionalQueueTargetViews } from "./regional-queue-target-view.js";
import { newRegionalQueueTarget } from "./regional-queue-target.js";

test("RegionalQueueTargetView shows the status in capitals", () => {
  const item = newRegionalQueueTarget("code-792", "name-286");
  const view = toRegionalQueueTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalQueueTargetViews([item, item]).length, 2, "views");
});
