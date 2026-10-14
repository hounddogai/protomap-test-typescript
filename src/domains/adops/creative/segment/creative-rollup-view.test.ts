import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeRollupView, toCreativeRollupViews } from "./creative-rollup-view.js";
import { newCreativeRollup } from "./creative-rollup.js";

test("CreativeRollupView shows the status in capitals", () => {
  const item = newCreativeRollup("code-770", "title-438");
  const view = toCreativeRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeRollupViews([item, item]).length, 2, "views");
});
