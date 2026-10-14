import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyWarmupAllocationReport } from "./legacy-warmup-allocation-report.js";
import { LegacyWarmupAllocation, newLegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

test("LegacyWarmupAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_014_427);
  const items: LegacyWarmupAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyWarmupAllocation(`legacy-warmup-allocation-${index}`, "sample"));
  }
  const report = buildLegacyWarmupAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
