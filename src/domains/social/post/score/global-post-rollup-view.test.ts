import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalPostRollupView, toGlobalPostRollupViews } from "./global-post-rollup-view.js";
import { newGlobalPostRollup } from "./global-post-rollup.js";

test("GlobalPostRollupView shows the status in capitals", () => {
  const item = newGlobalPostRollup("code-408", "label-661");
  const view = toGlobalPostRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalPostRollupViews([item, item]).length, 2, "views");
});
