import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueVarianceView, toQueueVarianceViews } from "./queue-variance-view.js";
import { newQueueVariance } from "./queue-variance.js";

test("QueueVarianceView shows the status in capitals", () => {
  const item = newQueueVariance("code-986", "label-319");
  const view = toQueueVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueVarianceViews([item, item]).length, 2, "views");
});
