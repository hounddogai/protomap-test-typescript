import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPacingMappingReport } from "./batched-pacing-mapping-report.js";
import { BatchedPacingMapping, newBatchedPacingMapping } from "./batched-pacing-mapping.js";

test("BatchedPacingMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_867_889);
  const items: BatchedPacingMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedPacingMapping(`batched-pacing-mapping-${index}`, "sample"));
  }
  const report = buildBatchedPacingMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
