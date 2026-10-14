import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedProofCycleReport } from "./batched-proof-cycle-report.js";
import { BatchedProofCycle, newBatchedProofCycle } from "./batched-proof-cycle.js";

test("BatchedProofCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_951_427);
  const items: BatchedProofCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedProofCycle(`batched-proof-cycle-${index}`, "sample"));
  }
  const report = buildBatchedProofCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
