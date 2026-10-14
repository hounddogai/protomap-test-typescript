import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceSlotReport } from "./bounce-slot-report.js";
import { BounceSlot, newBounceSlot } from "./bounce-slot.js";

test("BounceSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_245_515);
  const items: BounceSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBounceSlot(`bounce-slot-${index}`, "sample"));
  }
  const report = buildBounceSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
