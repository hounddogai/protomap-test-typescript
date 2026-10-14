import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedEscalationRollupReport } from "./batched-escalation-rollup-report.js";
import { BatchedEscalationRollup, newBatchedEscalationRollup } from "./batched-escalation-rollup.js";

test("BatchedEscalationRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_204_144);
  const items: BatchedEscalationRollup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedEscalationRollup(`batched-escalation-rollup-${index}`, "sample"));
  }
  const report = buildBatchedEscalationRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
