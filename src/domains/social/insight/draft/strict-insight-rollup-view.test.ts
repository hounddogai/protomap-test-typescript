import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictInsightRollupView, toStrictInsightRollupViews } from "./strict-insight-rollup-view.js";
import { newStrictInsightRollup } from "./strict-insight-rollup.js";

test("StrictInsightRollupView shows the status in capitals", () => {
  const item = newStrictInsightRollup("code-160", "label-233");
  const view = toStrictInsightRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictInsightRollupViews([item, item]).length, 2, "views");
});
