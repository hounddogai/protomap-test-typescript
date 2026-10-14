import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingQueueVarianceView, toRollingQueueVarianceViews } from "./rolling-queue-variance-view.js";
import { newRollingQueueVariance } from "./rolling-queue-variance.js";

test("RollingQueueVarianceView shows the status in capitals", () => {
  const item = newRollingQueueVariance("code-885", "label-664");
  const view = toRollingQueueVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingQueueVarianceViews([item, item]).length, 2, "views");
});
