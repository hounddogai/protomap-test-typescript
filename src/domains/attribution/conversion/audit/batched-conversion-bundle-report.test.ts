import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedConversionBundleReport } from "./batched-conversion-bundle-report.js";
import { BatchedConversionBundle, newBatchedConversionBundle } from "./batched-conversion-bundle.js";

test("BatchedConversionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_068_069);
  const items: BatchedConversionBundle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedConversionBundle(`batched-conversion-bundle-${index}`, "sample"));
  }
  const report = buildBatchedConversionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
