import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingMacroSlotReport } from "./rolling-macro-slot-report.js";
import { RollingMacroSlot, newRollingMacroSlot } from "./rolling-macro-slot.js";

test("RollingMacroSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_878_638);
  const items: RollingMacroSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingMacroSlot(`rolling-macro-slot-${index}`, "sample"));
  }
  const report = buildRollingMacroSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
