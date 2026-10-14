import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedWaitPreferenceReport } from "./batched-wait-preference-report.js";
import { BatchedWaitPreference, newBatchedWaitPreference } from "./batched-wait-preference.js";

test("BatchedWaitPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_850_893);
  const items: BatchedWaitPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedWaitPreference(`batched-wait-preference-${index}`, "sample"));
  }
  const report = buildBatchedWaitPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
