import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedCohortBundleReport } from "./batched-cohort-bundle-report.js";
import { BatchedCohortBundle, newBatchedCohortBundle } from "./batched-cohort-bundle.js";

test("BatchedCohortBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_972_698);
  const items: BatchedCohortBundle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedCohortBundle(`batched-cohort-bundle-${index}`, "sample"));
  }
  const report = buildBatchedCohortBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
