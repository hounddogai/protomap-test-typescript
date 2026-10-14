import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelSlotReport } from "./funnel-slot-report.js";
import { FunnelSlot, newFunnelSlot } from "./funnel-slot.js";

test("FunnelSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_664_806);
  const items: FunnelSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFunnelSlot(`funnel-slot-${index}`, "sample"));
  }
  const report = buildFunnelSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
