import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDeflectionSlotReport } from "./legacy-deflection-slot-report.js";
import { LegacyDeflectionSlot, newLegacyDeflectionSlot } from "./legacy-deflection-slot.js";

test("LegacyDeflectionSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_907_076);
  const items: LegacyDeflectionSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyDeflectionSlot(`legacy-deflection-slot-${index}`, "sample"));
  }
  const report = buildLegacyDeflectionSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
