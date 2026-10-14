import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalCreativeSlotReport } from "./global-creative-slot-report.js";
import { GlobalCreativeSlot, newGlobalCreativeSlot } from "./global-creative-slot.js";

test("GlobalCreativeSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_378_414);
  const items: GlobalCreativeSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newGlobalCreativeSlot(`global-creative-slot-${index}`, "sample"));
  }
  const report = buildGlobalCreativeSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
