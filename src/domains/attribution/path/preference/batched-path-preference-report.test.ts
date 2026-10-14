import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPathPreferenceReport } from "./batched-path-preference-report.js";
import { BatchedPathPreference, newBatchedPathPreference } from "./batched-path-preference.js";

test("BatchedPathPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_655_152);
  const items: BatchedPathPreference[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedPathPreference(`batched-path-preference-${index}`, "sample"));
  }
  const report = buildBatchedPathPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
