import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPlacementPreferenceReport } from "./batched-placement-preference-report.js";
import { BatchedPlacementPreference, newBatchedPlacementPreference } from "./batched-placement-preference.js";

test("BatchedPlacementPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_849_393);
  const items: BatchedPlacementPreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedPlacementPreference(`batched-placement-preference-${index}`, "sample"));
  }
  const report = buildBatchedPlacementPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
