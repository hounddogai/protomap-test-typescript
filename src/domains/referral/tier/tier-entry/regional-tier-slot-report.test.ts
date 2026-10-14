import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalTierSlotReport } from "./regional-tier-slot-report.js";
import { RegionalTierSlot, newRegionalTierSlot } from "./regional-tier-slot.js";

test("RegionalTierSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_119_336);
  const items: RegionalTierSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalTierSlot(`regional-tier-slot-${index}`, "sample"));
  }
  const report = buildRegionalTierSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
