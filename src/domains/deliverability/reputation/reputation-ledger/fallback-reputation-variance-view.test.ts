import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackReputationVarianceView,
  toFallbackReputationVarianceViews,
} from "./fallback-reputation-variance-view.js";
import { newFallbackReputationVariance } from "./fallback-reputation-variance.js";

test("FallbackReputationVarianceView shows the status in capitals", () => {
  const item = newFallbackReputationVariance("code-193", "label-364");
  const view = toFallbackReputationVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackReputationVarianceViews([item, item]).length, 2, "views");
});
