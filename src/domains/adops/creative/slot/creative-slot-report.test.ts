import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeSlotReport } from "./creative-slot-report.js";
import { CreativeSlot, newCreativeSlot } from "./creative-slot.js";

test("CreativeSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_404_078);
  const items: CreativeSlot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreativeSlot(`creative-slot-${index}`, "sample"));
  }
  const report = buildCreativeSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
