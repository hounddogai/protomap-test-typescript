import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupVarianceView, toWarmupVarianceViews } from "./warmup-variance-view.js";
import { newWarmupVariance } from "./warmup-variance.js";

test("WarmupVarianceView shows the status in capitals", () => {
  const item = newWarmupVariance("code-568", "name-952");
  const view = toWarmupVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupVarianceViews([item, item]).length, 2, "views");
});
