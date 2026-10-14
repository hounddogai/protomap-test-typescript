import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCreativeRollupView, toStrictCreativeRollupViews } from "./strict-creative-rollup-view.js";
import { newStrictCreativeRollup } from "./strict-creative-rollup.js";

test("StrictCreativeRollupView shows the status in capitals", () => {
  const item = newStrictCreativeRollup("code-861", "label-44");
  const view = toStrictCreativeRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCreativeRollupViews([item, item]).length, 2, "views");
});
