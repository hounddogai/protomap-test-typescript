import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedComplaintWindowReport } from "./batched-complaint-window-report.js";
import { BatchedComplaintWindow, newBatchedComplaintWindow } from "./batched-complaint-window.js";

test("BatchedComplaintWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_335_637);
  const items: BatchedComplaintWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedComplaintWindow(`batched-complaint-window-${index}`, "sample"));
  }
  const report = buildBatchedComplaintWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
