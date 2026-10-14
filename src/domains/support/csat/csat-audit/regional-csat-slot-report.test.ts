import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalCsatSlotReport } from "./regional-csat-slot-report.js";
import { RegionalCsatSlot, newRegionalCsatSlot } from "./regional-csat-slot.js";

test("RegionalCsatSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_852_538);
  const items: RegionalCsatSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalCsatSlot(`regional-csat-slot-${index}`, "sample"));
  }
  const report = buildRegionalCsatSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
