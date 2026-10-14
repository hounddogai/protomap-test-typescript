import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingFrequencyCycleView, toPendingFrequencyCycleViews } from "./pending-frequency-cycle-view.js";
import { newPendingFrequencyCycle } from "./pending-frequency-cycle.js";

test("PendingFrequencyCycleView shows the status in capitals", () => {
  const item = newPendingFrequencyCycle("code-844", "title-927");
  const view = toPendingFrequencyCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingFrequencyCycleViews([item, item]).length, 2, "views");
});
