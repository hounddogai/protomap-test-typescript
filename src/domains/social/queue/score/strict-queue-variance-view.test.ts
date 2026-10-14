import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictQueueVarianceView, toStrictQueueVarianceViews } from "./strict-queue-variance-view.js";
import { newStrictQueueVariance } from "./strict-queue-variance.js";

test("StrictQueueVarianceView shows the status in capitals", () => {
  const item = newStrictQueueVariance("code-902", "name-372");
  const view = toStrictQueueVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictQueueVarianceViews([item, item]).length, 2, "views");
});
