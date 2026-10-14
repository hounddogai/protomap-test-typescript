import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionThresholdView, toRetentionThresholdViews } from "./retention-threshold-view.js";
import { newRetentionThreshold } from "./retention-threshold.js";

test("RetentionThresholdView shows the status in capitals", () => {
  const item = newRetentionThreshold("code-664", "name-683");
  const view = toRetentionThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionThresholdViews([item, item]).length, 2, "views");
});
