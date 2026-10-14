import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveFunnelSlotReport } from "./adaptive-funnel-slot-report.js";
import { AdaptiveFunnelSlot, newAdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

test("AdaptiveFunnelSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_218_971);
  const items: AdaptiveFunnelSlot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveFunnelSlot(`adaptive-funnel-slot-${index}`, "sample"));
  }
  const report = buildAdaptiveFunnelSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
