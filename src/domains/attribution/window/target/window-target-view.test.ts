import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowTargetView, toWindowTargetViews } from "./window-target-view.js";
import { newWindowTarget } from "./window-target.js";

test("WindowTargetView shows the status in capitals", () => {
  const item = newWindowTarget("code-593", "name-164");
  const view = toWindowTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowTargetViews([item, item]).length, 2, "views");
});
