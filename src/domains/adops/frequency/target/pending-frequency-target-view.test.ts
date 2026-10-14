import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingFrequencyTargetView, toPendingFrequencyTargetViews } from "./pending-frequency-target-view.js";
import { newPendingFrequencyTarget } from "./pending-frequency-target.js";

test("PendingFrequencyTargetView shows the status in capitals", () => {
  const item = newPendingFrequencyTarget("code-210", "title-50");
  const view = toPendingFrequencyTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingFrequencyTargetViews([item, item]).length, 2, "views");
});
