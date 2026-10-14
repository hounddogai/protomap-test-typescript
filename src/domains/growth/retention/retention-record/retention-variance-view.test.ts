import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionVarianceView, toRetentionVarianceViews } from "./retention-variance-view.js";
import { newRetentionVariance } from "./retention-variance.js";

test("RetentionVarianceView shows the status in capitals", () => {
  const item = newRetentionVariance("code-79", "label-917");
  const view = toRetentionVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionVarianceViews([item, item]).length, 2, "views");
});
