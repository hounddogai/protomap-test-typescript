import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationVarianceView, toReputationVarianceViews } from "./reputation-variance-view.js";
import { newReputationVariance } from "./reputation-variance.js";

test("ReputationVarianceView shows the status in capitals", () => {
  const item = newReputationVariance("code-326", "name-219");
  const view = toReputationVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationVarianceViews([item, item]).length, 2, "views");
});
