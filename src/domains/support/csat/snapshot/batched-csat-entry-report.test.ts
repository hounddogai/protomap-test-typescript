import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedCsatEntryReport } from "./batched-csat-entry-report.js";
import { BatchedCsatEntry, newBatchedCsatEntry } from "./batched-csat-entry.js";

test("BatchedCsatEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_138_934);
  const items: BatchedCsatEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedCsatEntry(`batched-csat-entry-${index}`, "sample"));
  }
  const report = buildBatchedCsatEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
