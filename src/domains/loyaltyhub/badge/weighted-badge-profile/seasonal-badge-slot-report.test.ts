import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalBadgeSlotReport } from "./seasonal-badge-slot-report.js";
import { SeasonalBadgeSlot, newSeasonalBadgeSlot } from "./seasonal-badge-slot.js";

test("SeasonalBadgeSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_499_798);
  const items: SeasonalBadgeSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalBadgeSlot(`seasonal-badge-slot-${index}`, "sample"));
  }
  const report = buildSeasonalBadgeSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
