import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultWarmupEstimateView, toDefaultWarmupEstimateViews } from "./default-warmup-estimate-view.js";
import { newDefaultWarmupEstimate } from "./default-warmup-estimate.js";

test("DefaultWarmupEstimateView shows the status in capitals", () => {
  const item = newDefaultWarmupEstimate("code-97", "title-123");
  const view = toDefaultWarmupEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultWarmupEstimateViews([item, item]).length, 2, "views");
});
