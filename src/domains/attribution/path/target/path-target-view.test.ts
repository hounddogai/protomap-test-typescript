import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathTargetView, toPathTargetViews } from "./path-target-view.js";
import { newPathTarget } from "./path-target.js";

test("PathTargetView shows the status in capitals", () => {
  const item = newPathTarget("code-518", "name-892");
  const view = toPathTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathTargetViews([item, item]).length, 2, "views");
});
