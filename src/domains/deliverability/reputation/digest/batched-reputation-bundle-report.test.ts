import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedReputationBundleReport } from "./batched-reputation-bundle-report.js";
import { BatchedReputationBundle, newBatchedReputationBundle } from "./batched-reputation-bundle.js";

test("BatchedReputationBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_422_128);
  const items: BatchedReputationBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedReputationBundle(`batched-reputation-bundle-${index}`, "sample"));
  }
  const report = buildBatchedReputationBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
