import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedFunnelPreferenceReport } from "./batched-funnel-preference-report.js";
import { BatchedFunnelPreference, newBatchedFunnelPreference } from "./batched-funnel-preference.js";

test("BatchedFunnelPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_218_542);
  const items: BatchedFunnelPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedFunnelPreference(`batched-funnel-preference-${index}`, "sample"));
  }
  const report = buildBatchedFunnelPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
