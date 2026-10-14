import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryPathSlotReport } from "./primary-path-slot-report.js";
import { PrimaryPathSlot, newPrimaryPathSlot } from "./primary-path-slot.js";

test("PrimaryPathSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_649_718);
  const items: PrimaryPathSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryPathSlot(`primary-path-slot-${index}`, "sample"));
  }
  const report = buildPrimaryPathSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
