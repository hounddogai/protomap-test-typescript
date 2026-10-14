import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionRollupView, toRetentionRollupViews } from "./retention-rollup-view.js";
import { newRetentionRollup } from "./retention-rollup.js";

test("RetentionRollupView shows the status in capitals", () => {
  const item = newRetentionRollup("code-745", "name-743");
  const view = toRetentionRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionRollupViews([item, item]).length, 2, "views");
});
