import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRetentionSlotReport } from "./weighted-retention-slot-report.js";
import { WeightedRetentionSlot, newWeightedRetentionSlot } from "./weighted-retention-slot.js";

test("WeightedRetentionSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_762_286);
  const items: WeightedRetentionSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedRetentionSlot(`weighted-retention-slot-${index}`, "sample"));
  }
  const report = buildWeightedRetentionSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
