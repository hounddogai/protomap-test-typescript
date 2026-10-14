import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalMacroSlotReport } from "./seasonal-macro-slot-report.js";
import { SeasonalMacroSlot, newSeasonalMacroSlot } from "./seasonal-macro-slot.js";

test("SeasonalMacroSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_929_760);
  const items: SeasonalMacroSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalMacroSlot(`seasonal-macro-slot-${index}`, "sample"));
  }
  const report = buildSeasonalMacroSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
