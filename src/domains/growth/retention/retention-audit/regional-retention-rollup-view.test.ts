import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalRetentionRollupView, toRegionalRetentionRollupViews } from "./regional-retention-rollup-view.js";
import { newRegionalRetentionRollup } from "./regional-retention-rollup.js";

test("RegionalRetentionRollupView shows the status in capitals", () => {
  const item = newRegionalRetentionRollup("code-906", "title-885");
  const view = toRegionalRetentionRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalRetentionRollupViews([item, item]).length, 2, "views");
});
