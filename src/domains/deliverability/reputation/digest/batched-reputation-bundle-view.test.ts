import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedReputationBundleView, toBatchedReputationBundleViews } from "./batched-reputation-bundle-view.js";
import { newBatchedReputationBundle } from "./batched-reputation-bundle.js";

test("BatchedReputationBundleView shows the status in capitals", () => {
  const item = newBatchedReputationBundle("code-609", "title-25");
  const view = toBatchedReputationBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedReputationBundleViews([item, item]).length, 2, "views");
});
