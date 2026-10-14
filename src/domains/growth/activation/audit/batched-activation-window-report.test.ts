import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedActivationWindowReport } from "./batched-activation-window-report.js";
import { BatchedActivationWindow, newBatchedActivationWindow } from "./batched-activation-window.js";

test("BatchedActivationWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_053_570);
  const items: BatchedActivationWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedActivationWindow(`batched-activation-window-${index}`, "sample"));
  }
  const report = buildBatchedActivationWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
