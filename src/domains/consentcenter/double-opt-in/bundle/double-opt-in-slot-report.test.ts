import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInSlotReport } from "./double-opt-in-slot-report.js";
import { DoubleOptInSlot, newDoubleOptInSlot } from "./double-opt-in-slot.js";

test("DoubleOptInSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_383_390);
  const items: DoubleOptInSlot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDoubleOptInSlot(`double-opt-in-slot-${index}`, "sample"));
  }
  const report = buildDoubleOptInSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
