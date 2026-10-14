import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedSenderRollupReport } from "./batched-sender-rollup-report.js";
import { BatchedSenderRollup, newBatchedSenderRollup } from "./batched-sender-rollup.js";

test("BatchedSenderRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_658_900);
  const items: BatchedSenderRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedSenderRollup(`batched-sender-rollup-${index}`, "sample"));
  }
  const report = buildBatchedSenderRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
