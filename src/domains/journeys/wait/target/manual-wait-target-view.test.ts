import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualWaitTargetView, toManualWaitTargetViews } from "./manual-wait-target-view.js";
import { newManualWaitTarget } from "./manual-wait-target.js";

test("ManualWaitTargetView shows the status in capitals", () => {
  const item = newManualWaitTarget("code-223", "name-320");
  const view = toManualWaitTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualWaitTargetViews([item, item]).length, 2, "views");
});
