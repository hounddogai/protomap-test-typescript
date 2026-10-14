import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedStreakExceptionReport } from "./batched-streak-exception-report.js";
import { BatchedStreakException, newBatchedStreakException } from "./batched-streak-exception.js";

test("BatchedStreakExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_645_587);
  const items: BatchedStreakException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedStreakException(`batched-streak-exception-${index}`, "sample"));
  }
  const report = buildBatchedStreakExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
