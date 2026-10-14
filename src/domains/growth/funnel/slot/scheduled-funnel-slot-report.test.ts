import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledFunnelSlotReport } from "./scheduled-funnel-slot-report.js";
import { ScheduledFunnelSlot, newScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

test("ScheduledFunnelSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_707_972);
  const items: ScheduledFunnelSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledFunnelSlot(`scheduled-funnel-slot-${index}`, "sample"));
  }
  const report = buildScheduledFunnelSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
