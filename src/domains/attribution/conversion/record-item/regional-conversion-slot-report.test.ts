import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalConversionSlotReport } from "./regional-conversion-slot-report.js";
import { RegionalConversionSlot, newRegionalConversionSlot } from "./regional-conversion-slot.js";

test("RegionalConversionSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_125_310);
  const items: RegionalConversionSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalConversionSlot(`regional-conversion-slot-${index}`, "sample"));
  }
  const report = buildRegionalConversionSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
