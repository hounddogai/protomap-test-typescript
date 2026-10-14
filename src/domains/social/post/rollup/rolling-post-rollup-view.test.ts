import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPostRollupView, toRollingPostRollupViews } from "./rolling-post-rollup-view.js";
import { newRollingPostRollup } from "./rolling-post-rollup.js";

test("RollingPostRollupView shows the status in capitals", () => {
  const item = newRollingPostRollup("code-544", "label-844");
  const view = toRollingPostRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPostRollupViews([item, item]).length, 2, "views");
});
