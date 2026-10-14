import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPostSlotReport } from "./rolling-post-slot-report.js";
import { RollingPostSlot, newRollingPostSlot } from "./rolling-post-slot.js";

test("RollingPostSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_813_742);
  const items: RollingPostSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingPostSlot(`rolling-post-slot-${index}`, "sample"));
  }
  const report = buildRollingPostSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
